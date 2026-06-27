import { Router } from "express";
import db from "../db";
import { extractToken, verifyToken } from "../auth";

const router = Router();

async function requireAuth(req: any, res: any, next: () => void): Promise<void> {
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

// GET /api/schedules — list all schedules
router.get("/", (req: any, res) => {
  const { completed, subject_id } = req.query;
  let query = `
    SELECT s.*, sb.name AS subject_name, sb.color AS subject_color
    FROM schedules s
    LEFT JOIN subjects sb ON s.subject_id = sb.id
    WHERE s.user_id = ?
  `;
  const params: any[] = [req.userId];

  if (completed !== undefined) {
    query += " AND s.completed = ?";
    params.push(completed === "true" ? 1 : 0);
  }

  if (subject_id) {
    query += " AND s.subject_id = ?";
    params.push(subject_id as string);
  }

  query += " ORDER BY s.due_date ASC, s.created_at DESC";

  const schedules = db.query(query).all(...params);
  res.json({ schedules });
});

// POST /api/schedules — create a new schedule
router.post("/", (req: any, res) => {
  const { subject_id, title, description, due_date, reminder_time } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const id = crypto.randomUUID();
  db.run(
    "INSERT INTO schedules (id, user_id, subject_id, title, description, due_date, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, req.userId, subject_id || null, title, description || "", due_date || null, reminder_time || null]
  );

  const schedule = db
    .query(
      `SELECT s.*, sb.name AS subject_name, sb.color AS subject_color
       FROM schedules s
       LEFT JOIN subjects sb ON s.subject_id = sb.id
       WHERE s.id = ?`
    )
    .get(id) as any;

  res.status(201).json({ schedule });
});

// GET /api/schedules/:id
router.get("/:id", (req: any, res) => {
  const schedule = db
    .query(
      `SELECT s.*, sb.name AS subject_name, sb.color AS subject_color
       FROM schedules s
       LEFT JOIN subjects sb ON s.subject_id = sb.id
       WHERE s.id = ? AND s.user_id = ?`
    )
    .get(req.params.id, req.userId) as any;

  if (!schedule) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  res.json({ schedule });
});

// PUT /api/schedules/:id
router.put("/:id", (req: any, res) => {
  const { subject_id, title, description, due_date, reminder_time, completed } = req.body;

  const existing = db
    .query("SELECT id FROM schedules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);

  if (!existing) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  db.run(
    `UPDATE schedules SET 
       subject_id = COALESCE(?, subject_id), 
       title = COALESCE(?, title), 
       description = COALESCE(?, description), 
       due_date = COALESCE(?, due_date), 
       reminder_time = COALESCE(?, reminder_time),
       completed = COALESCE(?, completed),
       updated_at = datetime('now') 
     WHERE id = ?`,
    [
      subject_id ?? null,
      title ?? null,
      description ?? null,
      due_date ?? null,
      reminder_time ?? null,
      completed !== undefined ? (completed ? 1 : 0) : null,
      req.params.id,
    ]
  );

  const updated = db
    .query(
      `SELECT s.*, sb.name AS subject_name, sb.color AS subject_color
       FROM schedules s
       LEFT JOIN subjects sb ON s.subject_id = sb.id
       WHERE s.id = ?`
    )
    .get(req.params.id) as any;

  res.json({ schedule: updated });
});

// DELETE /api/schedules/:id
router.delete("/:id", (req: any, res) => {
  const result = db.run(
    "DELETE FROM schedules WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId]
  );

  if (result.changes === 0) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  res.json({ success: true });
});

export default router;