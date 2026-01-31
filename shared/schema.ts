import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Projects aggregate multiple smallholder plots for carbon credit issuance
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  region: text("region").notNull(),
  province: text("province").notNull(),
  methodology: text("methodology").default("verra-bamboo"), // verification standard
  status: text("status").notNull().default("active"), // active, verified, completed
  totalHectares: real("total_hectares").default(0),
  totalStewards: integer("total_stewards").default(0),
  totalPlots: integer("total_plots").default(0),
  totalCarbonTons: real("total_carbon_tons").default(0),
  creditsIssued: real("credits_issued").default(0),
  creditsRetired: real("credits_retired").default(0),
  vintage: integer("vintage"), // year credits were issued
  startDate: timestamp("start_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stewards = pgTable("stewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  barangay: text("barangay").notNull(),
  province: text("province").notNull(),
  totalPlots: integer("total_plots").default(0),
  verifiedPlots: integer("verified_plots").default(0),
  totalEarnings: real("total_earnings").default(0),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plots = pgTable("plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  stewardId: varchar("steward_id").references(() => stewards.id),
  projectId: varchar("project_id").references(() => projects.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  areaHectares: real("area_hectares").notNull(),
  clumpCount: integer("clump_count").default(0),
  status: text("status").notNull().default("pending"),
  healthScore: integer("health_score").default(0),
  carbonTons: real("carbon_tons").default(0),
  lastVerified: timestamp("last_verified"),
  boundaries: jsonb("boundaries"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationEvents = pgTable("verification_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").references(() => plots.id),
  stewardId: varchar("steward_id").references(() => stewards.id),
  eventType: text("event_type").notNull(),
  status: text("status").notNull().default("pending"),
  evidenceUrls: text("evidence_urls").array(),
  notes: text("notes"),
  verifiedBy: text("verified_by"),
  paymentAmount: real("payment_amount"),
  paymentStatus: text("payment_status"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertStewardSchema = createInsertSchema(stewards).omit({
  id: true,
  createdAt: true,
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationEventSchema = createInsertSchema(verificationEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertSteward = z.infer<typeof insertStewardSchema>;
export type Steward = typeof stewards.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertVerificationEvent = z.infer<typeof insertVerificationEventSchema>;
export type VerificationEvent = typeof verificationEvents.$inferSelect;

// Chat tables for AI agent
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  plotId: varchar("plot_id").references(() => plots.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
