import { db } from "../../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getConversationByPlot(plotId: string): Promise<typeof conversations.$inferSelect | undefined>;
  getConversationsByPlot(plotId: string): Promise<(typeof conversations.$inferSelect)[]>;
  getConversationsByStew(stewardId: string): Promise<(typeof conversations.$inferSelect)[]>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string, plotId?: string | null, stewardId?: string | null): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  getMessageCountByConversation(conversationId: number): Promise<number>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  },

  async getConversationByPlot(plotId: string) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.plotId, plotId)).orderBy(desc(conversations.createdAt));
    return conversation;
  },

  async getConversationsByPlot(plotId: string) {
    return db.select().from(conversations).where(eq(conversations.plotId, plotId)).orderBy(desc(conversations.createdAt));
  },

  async getConversationsByStew(stewardId: string) {
    return db.select().from(conversations).where(eq(conversations.stewardId, stewardId)).orderBy(desc(conversations.createdAt));
  },

  async getAllConversations() {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string, plotId?: string | null, stewardId?: string | null) {
    const [conversation] = await db.insert(conversations).values({ title, plotId: plotId || null, stewardId: stewardId || null }).returning();
    return conversation;
  },

  async deleteConversation(id: number) {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  async getMessagesByConversation(conversationId: number) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  },

  async getMessageCountByConversation(conversationId: number) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(messages).where(eq(messages.conversationId, conversationId));
    return Number(result[0]?.count || 0);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  },
};

