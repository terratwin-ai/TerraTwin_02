import { 
  type User, 
  type InsertUser, 
  type Steward, 
  type InsertSteward,
  type Plot,
  type InsertPlot,
  type VerificationEvent,
  type InsertVerificationEvent,
  users,
  stewards,
  plots,
  verificationEvents
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getStewards(): Promise<Steward[]>;
  getSteward(id: string): Promise<Steward | undefined>;
  createSteward(steward: InsertSteward): Promise<Steward>;
  updateSteward(id: string, steward: Partial<InsertSteward>): Promise<Steward | undefined>;
  
  getPlots(): Promise<Plot[]>;
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsBySteward(stewardId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot | undefined>;
  
  getVerificationEvents(): Promise<VerificationEvent[]>;
  getVerificationEvent(id: string): Promise<VerificationEvent | undefined>;
  getVerificationEventsByPlot(plotId: string): Promise<VerificationEvent[]>;
  createVerificationEvent(event: InsertVerificationEvent): Promise<VerificationEvent>;
  updateVerificationEvent(id: string, event: Partial<InsertVerificationEvent>): Promise<VerificationEvent | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getStewards(): Promise<Steward[]> {
    return db.select().from(stewards);
  }

  async getSteward(id: string): Promise<Steward | undefined> {
    const [steward] = await db.select().from(stewards).where(eq(stewards.id, id));
    return steward;
  }

  async createSteward(steward: InsertSteward): Promise<Steward> {
    const [created] = await db.insert(stewards).values(steward).returning();
    return created;
  }

  async updateSteward(id: string, steward: Partial<InsertSteward>): Promise<Steward | undefined> {
    const [updated] = await db.update(stewards).set(steward).where(eq(stewards.id, id)).returning();
    return updated;
  }

  async getPlots(): Promise<Plot[]> {
    return db.select().from(plots);
  }

  async getPlot(id: string): Promise<Plot | undefined> {
    const [plot] = await db.select().from(plots).where(eq(plots.id, id));
    return plot;
  }

  async getPlotsBySteward(stewardId: string): Promise<Plot[]> {
    return db.select().from(plots).where(eq(plots.stewardId, stewardId));
  }

  async createPlot(plot: InsertPlot): Promise<Plot> {
    const [created] = await db.insert(plots).values(plot).returning();
    return created;
  }

  async updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot | undefined> {
    const [updated] = await db.update(plots).set(plot).where(eq(plots.id, id)).returning();
    return updated;
  }

  async getVerificationEvents(): Promise<VerificationEvent[]> {
    return db.select().from(verificationEvents);
  }

  async getVerificationEvent(id: string): Promise<VerificationEvent | undefined> {
    const [event] = await db.select().from(verificationEvents).where(eq(verificationEvents.id, id));
    return event;
  }

  async getVerificationEventsByPlot(plotId: string): Promise<VerificationEvent[]> {
    return db.select().from(verificationEvents).where(eq(verificationEvents.plotId, plotId));
  }

  async createVerificationEvent(event: InsertVerificationEvent): Promise<VerificationEvent> {
    const [created] = await db.insert(verificationEvents).values(event).returning();
    return created;
  }

  async updateVerificationEvent(id: string, event: Partial<InsertVerificationEvent>): Promise<VerificationEvent | undefined> {
    const [updated] = await db.update(verificationEvents).set(event).where(eq(verificationEvents.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
