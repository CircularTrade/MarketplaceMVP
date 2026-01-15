import { db } from "./db";
import { users, listings, orders, chatThreads, chatMessages, reviews, deliveryQuotes } from "@shared/schema";
import type { User, InsertUser, Listing, InsertListing, Order, InsertOrder, ChatThread, InsertChatThread, ChatMessage, InsertChatMessage, Review, InsertReview, DeliveryQuote, InsertDeliveryQuote } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeAccount(userId: string, stripeAccountId: string): Promise<void>;
  updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'companyName' | 'abn'>>): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  getAllListings(status?: string): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | undefined>;
  getListingsBySeller(sellerId: string): Promise<Listing[]>;
  getNearbyListings(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    materialType?: string;
    maxPrice?: number;
    condition?: string;
    deadline?: Date;
  }): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<void>;
  incrementListingViews(id: string): Promise<void>;
  flagListing(id: string): Promise<void>;
  
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderWithDetails(id: string): Promise<any | undefined>;
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<Order[]>;
  getOrdersBySellerWithListings(sellerId: string, status?: string): Promise<Array<{ order: Order; listing: Listing }>>;
  getOrdersByBuyerWithDetails(buyerId: string): Promise<any[]>;
  getOrdersBySellerWithDetails(sellerId: string): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  updateOrderPayment(id: string, paymentIntentId: string): Promise<void>;
  markOrderAsPaid(orderId: string): Promise<void>;
  
  // Chat/messaging methods
  findOrCreateThread(buyerId: string, sellerId: string, listingId: string): Promise<ChatThread>;
  getThreadsByUser(userId: string): Promise<Array<ChatThread & { listing: Listing; otherUser: User; lastMessage?: ChatMessage }>>;
  getThreadById(threadId: string): Promise<ChatThread | undefined>;
  getThreadWithDetails(threadId: string): Promise<{ thread: ChatThread; listing: Listing; buyer: User; seller: User } | undefined>;
  getMessagesByThread(threadId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateThreadLastRead(threadId: string, userId: string): Promise<void>;
  updateThreadUpdatedAt(threadId: string): Promise<void>;
  
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReviewsByListing(listingId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  createDeliveryQuote(quote: InsertDeliveryQuote): Promise<DeliveryQuote>;
  getDeliveryQuoteById(id: string): Promise<DeliveryQuote | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserStripeAccount(userId: string, stripeAccountId: string): Promise<void> {
    await db.update(users).set({ stripeAccountId }).where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'companyName' | 'abn'>>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async getAllListings(status?: string): Promise<Listing[]> {
    if (status) {
      return await db.select().from(listings).where(eq(listings.status, status)).orderBy(desc(listings.createdAt));
    }
    return await db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getListingById(id: string): Promise<Listing | undefined> {
    const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    return result[0];
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.sellerId, sellerId)).orderBy(desc(listings.createdAt));
  }

  async getNearbyListings(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    materialType?: string;
    maxPrice?: number;
    condition?: string;
    deadline?: Date;
  }): Promise<Listing[]> {
    const { lat, lng, radiusKm, materialType, maxPrice, condition, deadline } = params;
    
    // Calculate bounding box for efficiency
    const latDelta = radiusKm / 111; // ~111 km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    
    let query = db.select().from(listings)
      .where(eq(listings.status, 'active'))
      .$dynamic();
    
    // Add filters
    const conditions: any[] = [eq(listings.status, 'active')];
    
    if (materialType) {
      conditions.push(eq(listings.materialType, materialType));
    }
    
    if (maxPrice) {
      conditions.push(sql`${listings.price}::numeric <= ${maxPrice}`);
    }
    
    if (condition) {
      conditions.push(eq(listings.condition, condition));
    }
    
    if (deadline) {
      conditions.push(sql`${listings.pickupDeadline} <= ${deadline}`);
    }
    
    const results = await db.select().from(listings).where(and(...conditions));
    
    // Filter by actual distance using Haversine formula
    return results.filter(listing => {
      if (!listing.latitude || !listing.longitude) return false;
      
      const listingLat = parseFloat(listing.latitude);
      const listingLng = parseFloat(listing.longitude);
      
      const R = 6371; // Earth's radius in km
      const dLat = (listingLat - lat) * Math.PI / 180;
      const dLng = (listingLng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(listingLat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance <= radiusKm;
    });
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const result = await db.insert(listings).values(listing).returning();
    return result[0];
  }

  async updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing | undefined> {
    const result = await db.update(listings).set(listing).where(eq(listings.id, id)).returning();
    return result[0];
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async incrementListingViews(id: string): Promise<void> {
    const listing = await this.getListingById(id);
    if (listing) {
      await db.update(listings).set({ views: (listing.views || 0) + 1 }).where(eq(listings.id, id));
    }
  }

  async flagListing(id: string): Promise<void> {
    await db.update(listings).set({ flagged: true }).where(eq(listings.id, id));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderWithDetails(id: string): Promise<any | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;

    const listing = await this.getListingById(order.listingId);
    const deliveryQuote = order.deliveryQuoteId 
      ? await this.getDeliveryQuoteById(order.deliveryQuoteId)
      : null;

    return {
      ...order,
      listing,
      deliveryQuote,
    };
  }

  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.buyerId, buyerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.sellerId, sellerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersBySellerWithListings(sellerId: string, status?: string): Promise<Array<{ order: Order; listing: Listing }>> {
    const sellerOrders = await this.getOrdersBySeller(sellerId);
    const filtered = status 
      ? sellerOrders.filter(order => order.status === status)
      : sellerOrders;
    
    const results = await Promise.all(
      filtered.map(async (order) => {
        const listing = await this.getListingById(order.listingId);
        return { order, listing: listing! };
      })
    );
    
    return results.filter(r => r.listing);
  }

  async getOrdersByBuyerWithDetails(buyerId: string): Promise<any[]> {
    const buyerOrders = await this.getOrdersByBuyer(buyerId);
    
    return Promise.all(
      buyerOrders.map(async (order) => {
        const listing = await this.getListingById(order.listingId);
        const deliveryQuote = order.deliveryQuoteId 
          ? await this.getDeliveryQuoteById(order.deliveryQuoteId)
          : null;
        const seller = await this.getUser(order.sellerId);
        
        return {
          ...order,
          listing,
          deliveryQuote,
          seller,
        };
      })
    );
  }

  async getOrdersBySellerWithDetails(sellerId: string): Promise<any[]> {
    const sellerOrders = await this.getOrdersBySeller(sellerId);
    
    return Promise.all(
      sellerOrders.map(async (order) => {
        const listing = await this.getListingById(order.listingId);
        const deliveryQuote = order.deliveryQuoteId 
          ? await this.getDeliveryQuoteById(order.deliveryQuoteId)
          : null;
        const buyer = await this.getUser(order.buyerId);
        
        return {
          ...order,
          listing,
          deliveryQuote,
          buyer,
        };
      })
    );
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  async updateOrderPayment(id: string, paymentIntentId: string): Promise<void> {
    await db.update(orders)
      .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async markOrderAsPaid(orderId: string): Promise<void> {
    await db.update(orders)
      .set({ 
        status: 'PAID', 
        paidAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(orders.id, orderId));
  }

  // Chat thread methods
  async findOrCreateThread(buyerId: string, sellerId: string, listingId: string): Promise<ChatThread> {
    // Try to find existing thread
    const existing = await db.select().from(chatThreads)
      .where(
        and(
          eq(chatThreads.buyerId, buyerId),
          eq(chatThreads.sellerId, sellerId),
          eq(chatThreads.listingId, listingId)
        )
      )
      .limit(1);
    
    if (existing[0]) {
      return existing[0];
    }
    
    // Create new thread
    const result = await db.insert(chatThreads).values({
      buyerId,
      sellerId,
      listingId
    }).returning();
    
    return result[0];
  }

  async getThreadsByUser(userId: string): Promise<Array<ChatThread & { listing: Listing; otherUser: User; lastMessage?: ChatMessage }>> {
    const threads = await db.select().from(chatThreads)
      .where(
        or(
          eq(chatThreads.buyerId, userId),
          eq(chatThreads.sellerId, userId)
        )
      )
      .orderBy(desc(chatThreads.updatedAt));
    
    // Fetch related data for each thread
    const threadsWithDetails = await Promise.all(
      threads.map(async (thread) => {
        const listing = await this.getListingById(thread.listingId);
        const otherUserId = thread.buyerId === userId ? thread.sellerId : thread.buyerId;
        const otherUser = await this.getUser(otherUserId);
        
        // Get last message
        const lastMessages = await db.select().from(chatMessages)
          .where(eq(chatMessages.threadId, thread.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);
        
        return {
          ...thread,
          listing: listing!,
          otherUser: otherUser!,
          lastMessage: lastMessages[0]
        };
      })
    );
    
    return threadsWithDetails;
  }

  async getThreadById(threadId: string): Promise<ChatThread | undefined> {
    const result = await db.select().from(chatThreads).where(eq(chatThreads.id, threadId)).limit(1);
    return result[0];
  }

  async getThreadWithDetails(threadId: string): Promise<{ thread: ChatThread; listing: Listing; buyer: User; seller: User } | undefined> {
    const thread = await this.getThreadById(threadId);
    if (!thread) return undefined;
    
    const [listing, buyer, seller] = await Promise.all([
      this.getListingById(thread.listingId),
      this.getUser(thread.buyerId),
      this.getUser(thread.sellerId)
    ]);
    
    if (!listing || !buyer || !seller) return undefined;
    
    return { thread, listing, buyer, seller };
  }

  async getMessagesByThread(threadId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async updateThreadLastRead(threadId: string, userId: string): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread) return;
    
    const updateField = thread.buyerId === userId ? 'lastReadAtBuyer' : 'lastReadAtSeller';
    await db.update(chatThreads)
      .set({ [updateField]: new Date() })
      .where(eq(chatThreads.id, threadId));
  }

  async updateThreadUpdatedAt(threadId: string): Promise<void> {
    await db.update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, threadId));
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.reviewedUserId, userId)).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByListing(listingId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.listingId, listingId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async createDeliveryQuote(quote: InsertDeliveryQuote): Promise<DeliveryQuote> {
    const result = await db.insert(deliveryQuotes).values(quote).returning();
    return result[0];
  }

  async getDeliveryQuoteById(id: string): Promise<DeliveryQuote | undefined> {
    const result = await db.select().from(deliveryQuotes).where(eq(deliveryQuotes.id, id)).limit(1);
    return result[0];
  }
}

export const storage = new DbStorage();
