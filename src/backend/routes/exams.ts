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

// GET /api/exams — list all generated exams for the user
router.get("/", (req: any, res) => {
  const { type } = req.query;
  let query = `
    SELECT e.*, n.title AS note_title, s.name AS subject_name
    FROM exams e
    LEFT JOIN notes n ON e.note_id = n.id
    LEFT JOIN subjects s ON n.subject_id = s.id
    WHERE e.user_id = ?
  `;
  const params: any[] = [req.userId];

  if (type) {
    query += " AND e.type = ?";
    params.push(type as string);
  }

  query += " ORDER BY e.created_at DESC";

  const exams = db.query(query).all(...params);

  // Parse content JSON
  const parsed = exams.map((exam: any) => ({
    ...exam,
    content: typeof exam.content === "string" ? JSON.parse(exam.content) : exam.content,
  }));

  res.json({ exams: parsed });
});

// GET /api/exams/:id
router.get("/:id", (req: any, res) => {
  const exam = db
    .query(
      `SELECT e.*, n.title AS note_title, s.name AS subject_name
       FROM exams e
       LEFT JOIN notes n ON e.note_id = n.id
       LEFT JOIN subjects s ON n.subject_id = s.id
       WHERE e.id = ? AND e.user_id = ?`
    )
    .get(req.params.id, req.userId) as any;

  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  exam.content = typeof exam.content === "string" ? JSON.parse(exam.content) : exam.content;
  res.json({ exam });
});

// DELETE /api/exams/:id
router.delete("/:id", (req: any, res) => {
  const result = db.run(
    "DELETE FROM exams WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId]
  );

  if (result.changes === 0) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  res.json({ success: true });
});

export default router;