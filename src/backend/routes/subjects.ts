import { Router } from "express";
import db from "../db";
import { extractToken, verifyToken } from "../auth";

const router = Router();

/** Middleware: require authenticated user */
async function requireAuth(
  req: any,
  res: any,
  next: () => void
): Promise<void> {
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
  req.userId = payload.userId;
  next();
}

router.use(requireAuth);

// GET /api/subjects — list all subjects for the user
router.get("/", (req: any, res) => {
  const subjects = db
    .query(
      "SELECT id, user_id, name, color, created_at, updated_at FROM subjects WHERE user_id = ? ORDER BY name ASC"
    )
    .all(req.userId);
  res.json({ subjects });
});

// POST /api/subjects — create a new subject
router.post("/", (req: any, res) => {
  const { name, color } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const id = crypto.randomUUID();
  db.run(
    "INSERT INTO subjects (id, user_id, name, color) VALUES (?, ?, ?, ?)",
    [id, req.userId, name, color || "#6366f1"]
  );

  const subject = db
    .query("SELECT * FROM subjects WHERE id = ?")
    .get(id) as any;
  res.status(201).json({ subject });
});

// GET /api/subjects/:id
router.get("/:id", (req: any, res) => {
  const subject = db
    .query(
      "SELECT * FROM subjects WHERE id = ? AND user_id = ?"
    )
    .get(req.params.id, req.userId) as any;

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ subject });
});

// PUT /api/subjects/:id
router.put("/:id", (req: any, res) => {
  const { name, color } = req.body;
  const subject = db
    .query("SELECT * FROM subjects WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId) as any;

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  db.run(
    "UPDATE subjects SET name = COALESCE(?, name), color = COALESCE(?, color), updated_at = datetime('now') WHERE id = ?",
    [name ?? null, color ?? null, req.params.id]
  );

  const updated = db
    .query("SELECT * FROM subjects WHERE id = ?")
    .get(req.params.id) as any;
  res.json({ subject: updated });
});

// DELETE /api/subjects/:id
router.delete("/:id", (req: any, res) => {
  const result = db.run(
    "DELETE FROM subjects WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId]
  );
  if (result.changes === 0) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ success: true });
});

export default router;