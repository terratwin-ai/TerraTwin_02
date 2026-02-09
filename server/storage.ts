import { 
  type User, 
  type InsertUser, 
  type Project,
  type InsertProject,
  type Steward, 
  type InsertSteward,
  type Plot,
  type InsertPlot,
  type VerificationEvent,
  type InsertVerificationEvent,
  type Cooperative,
  type InsertCooperative,
  type CooperativeMember,
  type InsertCooperativeMember,
  type ProjectMilestone,
  type InsertProjectMilestone,
  type ProjectDocument,
  type InsertProjectDocument,
  users,
  projects,
  stewards,
  plots,
  verificationEvents,
  cooperatives,
  cooperativeMembers,
  projectMilestones,
  projectDocuments
} from "@shared/schema";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  
  getStewards(): Promise<Steward[]>;
  getSteward(id: string): Promise<Steward | undefined>;
  createSteward(steward: InsertSteward): Promise<Steward>;
  updateSteward(id: string, steward: Partial<InsertSteward>): Promise<Steward | undefined>;
  
  getPlots(): Promise<Plot[]>;
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsBySteward(stewardId: string): Promise<Plot[]>;
  getPlotsByProject(projectId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot | undefined>;
  
  getVerificationEvents(): Promise<VerificationEvent[]>;
  getVerificationEvent(id: string): Promise<VerificationEvent | undefined>;
  getVerificationEventsByPlot(plotId: string): Promise<VerificationEvent[]>;
  createVerificationEvent(event: InsertVerificationEvent): Promise<VerificationEvent>;
  updateVerificationEvent(id: string, event: Partial<InsertVerificationEvent>): Promise<VerificationEvent | undefined>;
  
  getCooperativesByProject(projectId: string): Promise<Cooperative[]>;
  getCooperative(id: string): Promise<Cooperative | undefined>;
  createCooperative(cooperative: InsertCooperative): Promise<Cooperative>;
  getCooperativeMembershipsBySteward(stewardId: string): Promise<{ membership: CooperativeMember; cooperative: Cooperative; project: Project | null }[]>;
  
  getCooperativeMembers(cooperativeId: string): Promise<CooperativeMember[]>;
  createCooperativeMember(member: InsertCooperativeMember): Promise<CooperativeMember>;
  
  getProjectMilestones(projectId: string): Promise<ProjectMilestone[]>;
  createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone>;
  
  getProjectDocuments(projectId: string): Promise<ProjectDocument[]>;
  createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument>;
  
  getProjectStewards(projectId: string): Promise<Steward[]>;
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

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated;
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

  async getPlotsByProject(projectId: string): Promise<Plot[]> {
    return db.select().from(plots).where(eq(plots.projectId, projectId));
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

  async getCooperativesByProject(projectId: string): Promise<Cooperative[]> {
    return db.select().from(cooperatives).where(eq(cooperatives.projectId, projectId));
  }

  async getCooperative(id: string): Promise<Cooperative | undefined> {
    const [cooperative] = await db.select().from(cooperatives).where(eq(cooperatives.id, id));
    return cooperative;
  }

  async createCooperative(cooperative: InsertCooperative): Promise<Cooperative> {
    const [created] = await db.insert(cooperatives).values(cooperative).returning();
    return created;
  }

  async getCooperativeMembers(cooperativeId: string): Promise<CooperativeMember[]> {
    return db.select().from(cooperativeMembers).where(eq(cooperativeMembers.cooperativeId, cooperativeId));
  }

  async createCooperativeMember(member: InsertCooperativeMember): Promise<CooperativeMember> {
    const [created] = await db.insert(cooperativeMembers).values(member).returning();
    return created;
  }

  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return db.select().from(projectMilestones).where(eq(projectMilestones.projectId, projectId));
  }

  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    const [created] = await db.insert(projectMilestones).values(milestone).returning();
    return created;
  }

  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId));
  }

  async createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument> {
    const [created] = await db.insert(projectDocuments).values(document).returning();
    return created;
  }

  async getCooperativeMembershipsBySteward(stewardId: string): Promise<{ membership: CooperativeMember; cooperative: Cooperative; project: Project | null }[]> {
    const memberships = await db.select().from(cooperativeMembers).where(eq(cooperativeMembers.stewardId, stewardId));
    const results: { membership: CooperativeMember; cooperative: Cooperative; project: Project | null }[] = [];
    for (const membership of memberships) {
      if (!membership.cooperativeId) continue;
      const [coop] = await db.select().from(cooperatives).where(eq(cooperatives.id, membership.cooperativeId));
      if (!coop) continue;
      let project: Project | null = null;
      if (coop.projectId) {
        const [proj] = await db.select().from(projects).where(eq(projects.id, coop.projectId));
        project = proj || null;
      }
      results.push({ membership, cooperative: coop, project });
    }
    return results;
  }

  async getProjectStewards(projectId: string): Promise<Steward[]> {
    const projectPlots = await db.select().from(plots).where(eq(plots.projectId, projectId));
    const stewardIdSet = new Set<string>();
    for (const plot of projectPlots) {
      if (plot.stewardId) stewardIdSet.add(plot.stewardId);
    }
    const stewardIds = Array.from(stewardIdSet);
    if (stewardIds.length === 0) return [];
    return db.select().from(stewards).where(inArray(stewards.id, stewardIds));
  }
}

export const storage = new DatabaseStorage();
