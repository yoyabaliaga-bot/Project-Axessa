import express from "express";
import cors from "cors";
import { initDB } from "./db";

import authRoutes from "./routes/auth";
import subjectsRoutes from "./routes/subjects";
import notesRoutes from "./routes/notes";
import generateRoutes from "./routes/generate";
import schedulesRoutes from "./routes/schedules";
import examsRoutes from "./routes/exams";

export function createBackend() {
  // Initialize database tables
  initDB();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Subject routes
  app.use("/api/subjects", subjectsRoutes);

  // Notes routes (includes /check, /reviewer, /mock-exam sub-routes)
  app.use("/api/notes", notesRoutes);

  // Generate routes
  app.use("/api/generate", generateRoutes);

  // Schedule routes
  app.use("/api/schedules", schedulesRoutes);

  // Exam routes
  app.use("/api/exams", examsRoutes);

  return app;
}

// Start server when run directly (not imported)
const port = Number(Bun.env.API_PORT || 3001);

if (import.meta.path === Bun.main) {
  const app = createBackend();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Axessa API server running on http://0.0.0.0:${port}`);
  });
}