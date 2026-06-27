import { Router } from "express";
import db from "../db";
import { extractToken, verifyToken } from "../auth";

const router = Router();

/** Middleware: require authenticated user */
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

// GET /api/notes — list all notes (optionally filtered by subject_id)
router.get("/", (req: any, res) => {
  const { subject_id } = req.query;
  let query = `
    SELECT n.id, n.user_id, n.subject_id, n.title, n.content, 
           n.created_at, n.updated_at, s.name AS subject_name, s.color AS subject_color
    FROM notes n
    LEFT JOIN subjects s ON n.subject_id = s.id
    WHERE n.user_id = ?
  `;
  const params: any[] = [req.userId];

  if (subject_id) {
    query += " AND n.subject_id = ?";
    params.push(subject_id as string);
  }

  query += " ORDER BY n.updated_at DESC";

  const notes = db.query(query).all(...params);
  res.json({ notes });
});

// POST /api/notes — create a new note
router.post("/", (req: any, res) => {
  const { subject_id, title, content } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const id = crypto.randomUUID();
  db.run(
    "INSERT INTO notes (id, user_id, subject_id, title, content) VALUES (?, ?, ?, ?, ?)",
    [id, req.userId, subject_id || null, title, content || ""]
  );

  const note = db
    .query("SELECT * FROM notes WHERE id = ?")
    .get(id) as any;
  res.status(201).json({ note });
});

// GET /api/notes/:id
router.get("/:id", (req: any, res) => {
  const note = db
    .query(
      `SELECT n.*, s.name AS subject_name, s.color AS subject_color
       FROM notes n
       LEFT JOIN subjects s ON n.subject_id = s.id
       WHERE n.id = ? AND n.user_id = ?`
    )
    .get(req.params.id, req.userId) as any;

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ note });
});

// PUT /api/notes/:id
router.put("/:id", (req: any, res) => {
  const { subject_id, title, content } = req.body;
  const existing = db
    .query("SELECT id FROM notes WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);

  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  db.run(
    `UPDATE notes SET 
       subject_id = COALESCE(?, subject_id), 
       title = COALESCE(?, title), 
       content = COALESCE(?, content), 
       updated_at = datetime('now') 
     WHERE id = ?`,
    [subject_id ?? null, title ?? null, content ?? null, req.params.id]
  );

  const updated = db
    .query(
      `SELECT n.*, s.name AS subject_name, s.color AS subject_color
       FROM notes n
       LEFT JOIN subjects s ON n.subject_id = s.id
       WHERE n.id = ?`
    )
    .get(req.params.id) as any;
  res.json({ note: updated });
});

// DELETE /api/notes/:id
router.delete("/:id", (req: any, res) => {
  const result = db.run(
    "DELETE FROM notes WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId]
  );
  if (result.changes === 0) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ success: true });
});

// POST /api/notes/:id/check — grammar and spelling check
router.post("/:id/check", (req: any, res) => {
  const note = db
    .query("SELECT content FROM notes WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId) as { content: string } | undefined;

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  // Basic grammar/spelling check using heuristics
  const content = note.content;
  const suggestions: Array<{ type: string; message: string; position?: number }> = [];

  // Check for common issues
  const commonMistakes: Array<{ pattern: RegExp; suggestion: string; message: string }> = [
    { pattern: /\bi\b/g, suggestion: "I", message: "Pronoun 'i' should be capitalized" },
    { pattern: /\bdont\b/gi, suggestion: "don't", message: "Missing apostrophe" },
    { pattern: /\bdidnt\b/gi, suggestion: "didn't", message: "Missing apostrophe" },
    { pattern: /\bwont\b/gi, suggestion: "won't", message: "Missing apostrophe" },
    { pattern: /\bcouldnt\b/gi, suggestion: "couldn't", message: "Missing apostrophe" },
    { pattern: /\bwouldnt\b/gi, suggestion: "wouldn't", message: "Missing apostrophe" },
    { pattern: /\bshouldnt\b/gi, suggestion: "shouldn't", message: "Missing apostrophe" },
    { pattern: /\bthats\b/gi, suggestion: "that's", message: "Missing apostrophe" },
    { pattern: /\bits\b/gi, suggestion: "its/it's", message: "Check if 'its' should be 'it's'" },
    { pattern: /\byour\b(?!\s+own\b)/gi, suggestion: "you're/your", message: "Check if 'your' should be 'you're'" },
    { pattern: /\btheir\b(?!\s+own\b)/gi, suggestion: "they're/their/there", message: "Check if 'their' should be 'they're' or 'there'" },
    { pattern: /\balot\b/gi, suggestion: "a lot", message: "'alot' should be 'a lot'" },
    { pattern: /\bseperate\b/gi, suggestion: "separate", message: "Spelling: 'seperate' should be 'separate'" },
    { pattern: /\brecieve\b/gi, suggestion: "receive", message: "Spelling: 'recieve' should be 'receive'" },
    { pattern: /\bdefinately\b/gi, suggestion: "definitely", message: "Spelling: 'definately' should be 'definitely'" },
    { pattern: /\boccured\b/gi, suggestion: "occurred", message: "Spelling: 'occured' should be 'occurred'" },
    { pattern: /\bcalender\b/gi, suggestion: "calendar", message: "Spelling: 'calender' should be 'calendar'" },
  ];

  for (let i = 0; i < commonMistakes.length; i++) {
    const { pattern, message } = commonMistakes[i];
    let match;
    while ((match = pattern.exec(content)) !== null) {
      suggestions.push({
        type: "grammar",
        message,
        position: match.index,
      });
    }
  }

  res.json({
    suggestions,
    corrected: content, // In production, this would use an AI service
  });
});

// POST /api/notes/:id/reviewer — generate reviewer from notes
router.post("/:id/reviewer", (req: any, res) => {
  const note = db
    .query(
      `SELECT n.*, s.name AS subject_name 
       FROM notes n 
       LEFT JOIN subjects s ON n.subject_id = s.id 
       WHERE n.id = ? AND n.user_id = ?`
    )
    .get(req.params.id, req.userId) as any;

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  // Generate a structured reviewer from the note content
  const content = note.content;
  const lines = content.split("\n").filter((l: string) => l.trim());

  // Extract key terms and create a reviewer
  const reviewer = {
    title: `Reviewer: ${note.title}`,
    subject: note.subject_name || "General",
    keyPoints: extractKeyPoints(content),
    definitions: extractDefinitions(content),
    questions: generateQuestions(content),
  };

  // Save to exams table
  const examId = crypto.randomUUID();
  db.run(
    "INSERT INTO exams (id, user_id, note_id, title, type, content) VALUES (?, ?, ?, ?, ?, ?)",
    [examId, req.userId, req.params.id, reviewer.title, "reviewer", JSON.stringify(reviewer)]
  );

  res.status(201).json({ reviewer, examId });
});

// POST /api/notes/:id/mock-exam — generate mock exam from notes
router.post("/:id/mock-exam", (req: any, res) => {
  const note = db
    .query(
      `SELECT n.*, s.name AS subject_name 
       FROM notes n 
       LEFT JOIN subjects s ON n.subject_id = s.id 
       WHERE n.id = ? AND n.user_id = ?`
    )
    .get(req.params.id, req.userId) as any;

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const content = note.content;
  const mockExam = {
    title: `Mock Exam: ${note.title}`,
    subject: note.subject_name || "General",
    questions: generateMockQuestions(content),
  };

  const examId = crypto.randomUUID();
  db.run(
    "INSERT INTO exams (id, user_id, note_id, title, type, content) VALUES (?, ?, ?, ?, ?, ?)",
    [examId, req.userId, req.params.id, mockExam.title, "mock_exam", JSON.stringify(mockExam)]
  );

  res.status(201).json({ mockExam, examId });
});

/** Extract key points from content */
function extractKeyPoints(content: string): string[] {
  const lines = content.split("\n").filter((l: string) => l.trim());
  const keyPoints: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for bullet points, numbered items, headings
    if (
      trimmed.startsWith("-") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#") ||
      /^\d+[.)]/.test(trimmed)
    ) {
      keyPoints.push(trimmed.replace(/^[-*#\s]+/, "").replace(/^\d+[.)]\s*/, ""));
    }
  }

  // If no structured key points, extract sentences with important keywords
  if (keyPoints.length === 0) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const keywords = ["important", "key", "essential", "critical", "note", "remember", "definition", "example"];
    for (const sentence of sentences) {
      if (keywords.some((kw) => sentence.toLowerCase().includes(kw))) {
        keyPoints.push(sentence.trim());
      }
    }
  }

  return keyPoints.length > 0 ? keyPoints.slice(0, 10) : ["No key points extracted"];
}

/** Extract definitions from content */
function extractDefinitions(content: string): Array<{ term: string; definition: string }> {
  const definitions: Array<{ term: string; definition: string }> = [];
  const defPatterns = [
    /(\w+[\s\w]*)\s+is\s+(?:defined\s+as\s+|refers\s+to\s+)?(.+?)(?:\.|$)/gi,
    /(\w+[\s\w]*)\s+means\s+(.+?)(?:\.|$)/gi,
    /(\w+[\s\w]*)\s+-\s+(.+?)(?:\.|$)/g,
  ];

  for (const pattern of defPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim(),
      });
    }
  }

  return definitions.slice(0, 10);
}

/** Generate questions from content */
function generateQuestions(content: string): Array<{ question: string; answer: string }> {
  const questions: Array<{ question: string; answer: string }> = [];
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

  for (const sentence of sentences.slice(0, 5)) {
    questions.push({
      question: `Explain: ${sentence.trim().replace(/^(Therefore|Thus|Hence|So)\s+/i, "")}`,
      answer: sentence.trim(),
    });
  }

  return questions;
}

/** Generate mock exam questions */
function generateMockQuestions(content: string): Array<{
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  answer: string;
}> {
  const questions: Array<{
    type: "multiple_choice" | "true_false" | "short_answer";
    question: string;
    options?: string[];
    answer: string;
  }> = [];

  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

  for (let i = 0; i < Math.min(sentences.length, 5); i++) {
    const sentence = sentences[i].trim();
    questions.push({
      type: "short_answer",
      question: `What is discussed in: "${sentence.replace(/^.{0,30}/, "...")}"?`,
      answer: sentence,
    });
  }

  // Add some true/false questions
  if (sentences.length >= 2) {
    questions.push({
      type: "true_false",
      question: `True or False: "${sentences[0].trim()}"`,
      answer: "True",
    });
  }

  return questions;
}

export default router;