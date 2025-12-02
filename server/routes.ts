import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";
import { connectToDatabase } from "./db/connection";
import authRoutes from "./routes/auth";
import roomsRoutes from "./routes/rooms";
import bookingsRoutes from "./routes/bookings";
import reviewsRoutes from "./routes/reviews";
import adminRoutes from "./routes/admin";
import managerRoutes from "./routes/manager";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectToDatabase();

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use("/api/auth", authRoutes);
  app.use("/api/rooms", roomsRoutes);
  app.use("/api/bookings", bookingsRoutes);
  app.use("/api/reviews", reviewsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/manager", managerRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
