import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertListingSchema,
  insertOrderSchema,
  insertChatThreadSchema,
  insertChatMessageSchema,
  insertReviewSchema,
  type User as DbUser,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDeliveryQuotes, geocodeAddress, calculateDistance } from "./deliveryService";
import { getUncachableStripeClient, getStripePublishableKey, getStripeWebhookSecret } from "./stripeClient";
import express from "express";
import { aggregateMetrics, calculateOrderMetrics } from "./sustainabilityUtils";


const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(
  supplied: string,
  stored: string,
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Passport middleware is initialized in server/index.ts (after session middleware)
  // Here we only configure the authentication strategy
  
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: DbUser | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Login failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json({ user: userWithoutPassword });
    }
    res.json({ user: null });
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const listings = await storage.getAllListings(status);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/near", async (req, res) => {
    try {
      const { lat, lng, radiusKm, materialType, maxPrice, condition, deadline } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const parsedLat = parseFloat(lat as string);
      const parsedLng = parseFloat(lng as string);
      const parsedRadius = radiusKm ? parseFloat(radiusKm as string) : 50;
      const parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;
      
      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }
      
      if (isNaN(parsedRadius) || parsedRadius <= 0) {
        return res.status(400).json({ message: "Invalid radius" });
      }
      
      if (parsedMaxPrice !== undefined && (isNaN(parsedMaxPrice) || parsedMaxPrice < 0)) {
        return res.status(400).json({ message: "Invalid max price" });
      }
      
      const params = {
        lat: parsedLat,
        lng: parsedLng,
        radiusKm: parsedRadius,
        materialType: materialType && materialType !== "all" ? (materialType as string) : undefined,
        maxPrice: parsedMaxPrice,
        condition: condition && condition !== "all" ? (condition as string) : undefined,
        deadline: deadline ? new Date(deadline as string) : undefined,
      };
      
      const listings = await storage.getNearbyListings(params);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching nearby listings:", error);
      res.status(500).json({ message: "Failed to fetch nearby listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      await storage.incrementListingViews(req.params.id);
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertListingSchema.parse({
        ...req.body,
        sellerId: req.user!.id,
      });
      const listing = await storage.createListing(validatedData);
      res.json(listing);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", requireAuth, async (req, res) => {
    try {
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updatedListing = await storage.updateListing(req.params.id, req.body);
      res.json(updatedListing);
    } catch (error) {
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", requireAuth, async (req, res) => {
    try {
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteListing(req.params.id);
      res.json({ message: "Listing deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.post("/api/delivery/quote", requireAuth, async (req, res) => {
    try {
      const { listingId, dropoffSuburb, dropoffPostcode } = req.body;

      if (!listingId || !dropoffSuburb || !dropoffPostcode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (!listing.suburb || !listing.postcode) {
        return res.status(400).json({ message: "Listing missing location information" });
      }

      const dropoffCoords = await geocodeAddress(dropoffSuburb, dropoffPostcode);
      if (!dropoffCoords) {
        return res.status(400).json({ message: "Could not find the specified dropoff location" });
      }

      const pickupLat = listing.latitude ? parseFloat(listing.latitude) : null;
      const pickupLng = listing.longitude ? parseFloat(listing.longitude) : null;

      if (!pickupLat || !pickupLng) {
        return res.status(400).json({ message: "Listing coordinates not available" });
      }

      const distanceKm = calculateDistance(
        pickupLat,
        pickupLng,
        dropoffCoords.latitude,
        dropoffCoords.longitude
      );

      const quotes = await getDeliveryQuotes({
        distanceKm,
        pickupSuburb: listing.suburb,
        pickupPostcode: listing.postcode,
        dropoffSuburb,
        dropoffPostcode,
      });

      const quotesWithIds = await Promise.all(quotes.map(async (quote) => {
        const savedQuote = await storage.createDeliveryQuote({
          listingId: listing.id,
          serviceId: quote.serviceId,
          serviceName: quote.serviceName,
          price: quote.price.toFixed(2),
          etaHours: quote.etaHours.toFixed(1),
          distanceKm: distanceKm.toFixed(2),
          dropoffSuburb,
          dropoffPostcode,
        });
        return savedQuote;
      }));

      res.json(quotesWithIds);
    } catch (error) {
      console.error("Error generating delivery quotes:", error);
      res.status(500).json({ message: "Failed to generate delivery quotes" });
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const type = req.query.type as "buyer" | "seller" | undefined;
      let orders;
      if (type === "seller") {
        orders = await storage.getOrdersBySeller(req.user!.id);
      } else {
        orders = await storage.getOrdersByBuyer(req.user!.id);
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const requestedListingId = req.body.listingId;
      const requestedQuoteId = req.body.deliveryQuoteId;
      
      if (!requestedListingId) {
        return res.status(400).json({ message: "Listing ID is required" });
      }
      
      if (!requestedQuoteId) {
        return res.status(400).json({ message: "Delivery quote ID is required" });
      }
      
      const listing = await storage.getListingById(requestedListingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const deliveryQuote = await storage.getDeliveryQuoteById(requestedQuoteId);
      if (!deliveryQuote) {
        return res.status(400).json({ message: "Invalid delivery quote ID" });
      }
      
      if (deliveryQuote.listingId !== listing.id) {
        return res.status(400).json({ message: "Delivery quote does not belong to this listing" });
      }
      
      const itemPrice = parseFloat(listing.price);
      const deliveryFee = parseFloat(deliveryQuote.price);
      const subtotal = itemPrice + deliveryFee;
      const marketplaceFee = subtotal * 0.08;
      const totalAmount = subtotal + marketplaceFee;
      
      const orderData = {
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: req.user!.id,
        deliveryQuoteId: deliveryQuote.id,
        itemPrice: itemPrice.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        marketplaceFee: marketplaceFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: 'RESERVED' as const,
      };
      
      const validatedData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateOrderStatus(req.params.id, status);
      res.json({ message: "Order status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.get("/api/reviews/listing/:listingId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByListing(req.params.listingId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user!.id,
      });
      const review = await storage.createReview(validatedData);
      res.json(review);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderWithDetails = await storage.getOrderWithDetails(req.params.id);
      if (!orderWithDetails) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (orderWithDetails.buyerId !== req.user!.id && orderWithDetails.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(orderWithDetails);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // ========== MESSAGING ROUTES ==========

  // Start or get existing chat thread
  app.post("/api/messages/start", requireAuth, async (req, res) => {
    try {
      const { listingId } = req.body;
      
      if (!listingId) {
        return res.status(400).json({ message: "Listing ID is required" });
      }
      
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Cannot message yourself
      if (listing.sellerId === req.user!.id) {
        return res.status(400).json({ message: "Cannot message yourself" });
      }
      
      // Buyer is the current user, seller is from the listing
      const thread = await storage.findOrCreateThread(
        req.user!.id, 
        listing.sellerId, 
        listingId
      );
      
      res.json(thread);
    } catch (error) {
      console.error("Error starting thread:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  // Get all threads for current user
  app.get("/api/messages/threads", requireAuth, async (req, res) => {
    try {
      const threads = await storage.getThreadsByUser(req.user!.id);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get specific thread with messages
  app.get("/api/messages/thread/:threadId", requireAuth, async (req, res) => {
    try {
      const { threadId } = req.params;
      
      const threadWithDetails = await storage.getThreadWithDetails(threadId);
      if (!threadWithDetails) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Verify user is participant
      if (
        threadWithDetails.thread.buyerId !== req.user!.id &&
        threadWithDetails.thread.sellerId !== req.user!.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get messages
      const messages = await storage.getMessagesByThread(threadId);
      
      // Mark as read
      await storage.updateThreadLastRead(threadId, req.user!.id);
      
      res.json({
        ...threadWithDetails,
        messages
      });
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Send a message
  app.post("/api/messages/send", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id
      });
      
      // Verify user is participant in the thread
      const thread = await storage.getThreadById(validatedData.threadId);
      if (!thread) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (thread.buyerId !== req.user!.id && thread.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create message
      const message = await storage.createChatMessage(validatedData);
      
      // Update thread's updatedAt timestamp
      await storage.updateThreadUpdatedAt(validatedData.threadId);
      
      res.json(message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const threads = await storage.getThreadsByUser(req.user!.id);
      
      let unreadCount = 0;
      for (const thread of threads) {
        if (!thread.lastMessage) continue;
        
        const lastReadAt = thread.buyerId === req.user!.id 
          ? thread.lastReadAtBuyer 
          : thread.lastReadAtSeller;
        
        if (!lastReadAt || new Date(thread.lastMessage.createdAt) > new Date(lastReadAt)) {
          unreadCount++;
        }
      }
      
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting publishable key:", error);
      res.status(500).json({ message: "Failed to get Stripe key" });
    }
  });

  app.post("/api/checkout/create", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const orderWithDetails = await storage.getOrderWithDetails(orderId);
      
      if (!orderWithDetails) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (orderWithDetails.buyerId !== req.user!.id) {
        return res.status(403).json({ message: "This order does not belong to you" });
      }

      if (orderWithDetails.status === 'PAID') {
        return res.status(400).json({ message: "Order has already been paid" });
      }

      if (!orderWithDetails.listing) {
        return res.status(400).json({ message: "Associated listing not found" });
      }

      if (orderWithDetails.listing.status !== 'active') {
        return res.status(400).json({ message: "Listing is no longer active" });
      }

      if (orderWithDetails.deliveryQuoteId && !orderWithDetails.deliveryQuote) {
        return res.status(400).json({ message: "Invalid delivery quote" });
      }

      const totalAmountCents = Math.round(parseFloat(orderWithDetails.totalAmount) * 100);

      const stripe = await getUncachableStripeClient();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'aud',
        metadata: {
          orderId: orderWithDetails.id,
          listingId: orderWithDetails.listingId,
          buyerId: orderWithDetails.buyerId,
          sellerId: orderWithDetails.sellerId,
          deliveryService: orderWithDetails.deliveryQuote?.serviceName || 'none',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      await storage.updateOrderPayment(orderId, paymentIntent.id);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating PaymentIntent:", error);
      res.status(500).json({ message: "Failed to create payment intent", error: error.message });
    }
  });

  app.post("/api/stripe/webhook", async (req, res) => {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const stripe = await getUncachableStripeClient();
        const webhookSecret = await getStripeWebhookSecret();
        
        const rawBody = req.rawBody as Buffer;
        if (!Buffer.isBuffer(rawBody)) {
          console.error('STRIPE WEBHOOK ERROR: req.rawBody is not a Buffer');
          return res.status(400).json({ error: 'Invalid request body' });
        }

        const event = stripe.webhooks.constructEvent(
          rawBody,
          Array.isArray(signature) ? signature[0] : signature,
          webhookSecret
        );

        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata.orderId;

          if (orderId) {
            await storage.markOrderAsPaid(orderId);
            console.log(`Order ${orderId} marked as paid`);
          } else {
            console.warn('Payment succeeded but no orderId in metadata');
          }
        } else if (event.type === 'payment_intent.payment_failed') {
          const paymentIntent = event.data.object as any;
          console.error('Payment failed for order:', paymentIntent.metadata.orderId);
        }

        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).json({ error: 'Webhook processing error' });
      }
    });

  // Dashboard routes
  app.get("/api/dashboard/summary", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const allListings = await storage.getListingsBySeller(userId);
      const activeListings = allListings.filter(l => l.status === 'active');
      const sellerOrders = await storage.getOrdersBySeller(userId);
      const paidOrders = sellerOrders.filter(o => o.status === 'PAID');
      const pendingOrders = sellerOrders.filter(o => o.status === 'RESERVED');
      
      // Get sustainability metrics for paid orders
      const paidOrdersWithListings = await storage.getOrdersBySellerWithListings(userId, 'PAID');
      const metrics = aggregateMetrics(paidOrdersWithListings);
      
      res.json({
        totalListings: allListings.length,
        activeListings: activeListings.length,
        totalOrders: sellerOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        sustainability: {
          totalTonnes: metrics.totalTonnes,
          totalTippingFeesSaved: metrics.totalTippingFeesSaved,
          totalCO2Avoided: metrics.totalCO2Avoided,
        },
      });
    } catch (error) {
      console.error("Dashboard summary error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  app.get("/api/dashboard/listings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const listings = await storage.getListingsBySeller(userId);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/dashboard/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const role = req.query.role as "seller" | "buyer" | undefined;
      
      let orders;
      if (role === "seller") {
        orders = await storage.getOrdersBySellerWithDetails(userId);
      } else if (role === "buyer") {
        orders = await storage.getOrdersByBuyerWithDetails(userId);
      } else {
        // Default to buyer orders
        orders = await storage.getOrdersByBuyerWithDetails(userId);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Dashboard orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/dashboard/sustainability", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all paid orders for this seller with listing details
      const paidOrdersWithListings = await storage.getOrdersBySellerWithListings(userId, 'PAID');
      
      // Calculate aggregate metrics
      const metrics = aggregateMetrics(paidOrdersWithListings);
      
      // Calculate individual order contributions
      const orderContributions = paidOrdersWithListings.map(({ order, listing }) => {
        const orderMetrics = calculateOrderMetrics(listing);
        return {
          orderId: order.id,
          listingTitle: listing.title,
          materialType: listing.materialType,
          tonnes: orderMetrics.tonnes,
          tippingFeesSaved: orderMetrics.tippingFeesSaved,
          co2Avoided: orderMetrics.co2Avoided,
          createdAt: order.createdAt,
        };
      });
      
      res.json({
        summary: {
          totalTonnes: metrics.totalTonnes,
          totalTippingFeesSaved: metrics.totalTippingFeesSaved,
          totalCO2Avoided: metrics.totalCO2Avoided,
        },
        byMaterial: metrics.byMaterial,
        recentOrders: orderContributions,
      });
    } catch (error) {
      console.error("Sustainability metrics error:", error);
      res.status(500).json({ message: "Failed to fetch sustainability metrics" });
    }
  });

  app.patch("/api/account/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, companyName, abn } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (abn !== undefined) updateData.abn = abn;
      
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/account/password", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
