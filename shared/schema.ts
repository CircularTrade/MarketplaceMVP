import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  abn: text("abn"),
  stripeAccountId: text("stripe_account_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  companyName: true,
  abn: true,
  stripeAccountId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  materialType: text("material_type").notNull(),
  condition: text("condition").notNull(),
  dimensions: text("dimensions"),
  estimatedWeightKg: decimal("estimated_weight_kg", { precision: 10, scale: 2 }),
  location: text("location").notNull(),
  suburb: text("suburb").notNull(),
  postcode: text("postcode").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  pickupDeadline: timestamp("pickup_deadline").notNull(),
  imageUrls: text("image_urls").array().notNull(),
  forkliftAvailable: boolean("forklift_available").default(false),
  status: text("status").notNull().default('active'),
  flagged: boolean("flagged").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  geoIndex: sql`CREATE INDEX IF NOT EXISTS listings_geo_idx ON ${table} (latitude, longitude)`,
}));

export const insertListingSchema = createInsertSchema(listings, {
  pickupDeadline: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  suburb: z.string().min(1, "Suburb is required"),
  postcode: z.string().min(1, "Postcode is required"),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  estimatedWeightKg: z.string().nullable().optional(),
  imageUrls: z.array(z.string().url()).min(1, "At least one image is required"),
}).omit({
  id: true,
  views: true,
  flagged: true,
  createdAt: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export const deliveryQuotes = pgTable("delivery_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  etaHours: decimal("eta_hours", { precision: 5, scale: 1 }).notNull(),
  dropoffSuburb: text("dropoff_suburb").notNull(),
  dropoffPostcode: text("dropoff_postcode").notNull(),
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeliveryQuoteSchema = createInsertSchema(deliveryQuotes).omit({
  id: true,
  createdAt: true,
});

export type InsertDeliveryQuote = z.infer<typeof insertDeliveryQuoteSchema>;
export type DeliveryQuote = typeof deliveryQuotes.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  deliveryQuoteId: varchar("delivery_quote_id").references(() => deliveryQuotes.id),
  itemPrice: decimal("item_price", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  marketplaceFee: decimal("marketplace_fee", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('RESERVED'),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Chat threads for buyer-seller conversations
export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  lastReadAtBuyer: timestamp("last_read_at_buyer"),
  lastReadAtSeller: timestamp("last_read_at_seller"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueThread: sql`CREATE UNIQUE INDEX IF NOT EXISTS chat_threads_unique_idx ON ${table} (buyer_id, seller_id, listing_id)`,
}));

export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({
  id: true,
  lastReadAtBuyer: true,
  lastReadAtSeller: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;

// Individual messages within a chat thread
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  messageText: text("message_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  threadIndex: sql`CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON ${table} (thread_id)`,
  createdAtIndex: sql`CREATE INDEX IF NOT EXISTS chat_messages_created_idx ON ${table} (created_at)`,
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  messageText: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  reviewedUserId: varchar("reviewed_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
