import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlotSchema, insertStewardSchema, insertVerificationEventSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/stewards", async (_req, res) => {
    try {
      const stewards = await storage.getStewards();
      res.json(stewards);
    } catch (error) {
      console.error("Error fetching stewards:", error);
      res.status(500).json({ error: "Failed to fetch stewards" });
    }
  });

  app.get("/api/stewards/:id", async (req, res) => {
    try {
      const steward = await storage.getSteward(req.params.id);
      if (!steward) {
        return res.status(404).json({ error: "Steward not found" });
      }
      res.json(steward);
    } catch (error) {
      console.error("Error fetching steward:", error);
      res.status(500).json({ error: "Failed to fetch steward" });
    }
  });

  app.post("/api/stewards", async (req, res) => {
    try {
      const data = insertStewardSchema.parse(req.body);
      const steward = await storage.createSteward(data);
      res.status(201).json(steward);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating steward:", error);
      res.status(500).json({ error: "Failed to create steward" });
    }
  });

  app.get("/api/plots", async (_req, res) => {
    try {
      const plots = await storage.getPlots();
      res.json(plots);
    } catch (error) {
      console.error("Error fetching plots:", error);
      res.status(500).json({ error: "Failed to fetch plots" });
    }
  });

  app.get("/api/plots/:id", async (req, res) => {
    try {
      const plot = await storage.getPlot(req.params.id);
      if (!plot) {
        return res.status(404).json({ error: "Plot not found" });
      }
      res.json(plot);
    } catch (error) {
      console.error("Error fetching plot:", error);
      res.status(500).json({ error: "Failed to fetch plot" });
    }
  });

  app.post("/api/plots", async (req, res) => {
    try {
      const data = insertPlotSchema.parse(req.body);
      const plot = await storage.createPlot(data);
      res.status(201).json(plot);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating plot:", error);
      res.status(500).json({ error: "Failed to create plot" });
    }
  });

  app.patch("/api/plots/:id", async (req, res) => {
    try {
      const data = insertPlotSchema.partial().parse(req.body);
      const plot = await storage.updatePlot(req.params.id, data);
      if (!plot) {
        return res.status(404).json({ error: "Plot not found" });
      }
      res.json(plot);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating plot:", error);
      res.status(500).json({ error: "Failed to update plot" });
    }
  });

  app.get("/api/verification-events", async (_req, res) => {
    try {
      const events = await storage.getVerificationEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching verification events:", error);
      res.status(500).json({ error: "Failed to fetch verification events" });
    }
  });

  app.get("/api/verification-events/:id", async (req, res) => {
    try {
      const event = await storage.getVerificationEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Verification event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching verification event:", error);
      res.status(500).json({ error: "Failed to fetch verification event" });
    }
  });

  app.get("/api/plots/:plotId/verification-events", async (req, res) => {
    try {
      const events = await storage.getVerificationEventsByPlot(req.params.plotId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching verification events:", error);
      res.status(500).json({ error: "Failed to fetch verification events" });
    }
  });

  app.post("/api/verification-events", async (req, res) => {
    try {
      const data = insertVerificationEventSchema.parse(req.body);
      const event = await storage.createVerificationEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating verification event:", error);
      res.status(500).json({ error: "Failed to create verification event" });
    }
  });

  app.patch("/api/verification-events/:id", async (req, res) => {
    try {
      const data = insertVerificationEventSchema.partial().parse(req.body);
      const event = await storage.updateVerificationEvent(req.params.id, data);
      if (!event) {
        return res.status(404).json({ error: "Verification event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating verification event:", error);
      res.status(500).json({ error: "Failed to update verification event" });
    }
  });

  return httpServer;
}
