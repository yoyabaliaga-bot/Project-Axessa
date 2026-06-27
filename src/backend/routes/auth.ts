import { Router } from "express";
import db from "../db";
import {
  createToken,
  hashPassword,
  verifyPassword,
  extractToken,
  verifyToken,
} from "../auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }

    // Check if user exists
    const existing = db
      .query("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const id = crypto.randomUUID();
    const password_hash = await hashPassword(password);

    db.run(
      "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)",
      [id, email, password_hash, name]
    );

    const token = await createToken({ userId: id, email });

    res.status(201).json({
      user: { id, email, name },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = db
      .query("SELECT id, email, password_hash, name FROM users WHERE email = ?")
      .get(email) as { id: string; email: string; password_hash: string; name: string } | undefined;

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = await createToken({ userId: user.id, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = extractToken(req.headers.authorization ?? null);
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const user = db
      .query("SELECT id, email, name, created_at FROM users WHERE id = ?")
      .get(payload.userId) as { id: string; email: string; name: string; created_at: string } | undefined;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;