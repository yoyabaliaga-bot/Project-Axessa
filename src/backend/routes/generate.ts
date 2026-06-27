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

// POST /api/generate/notes — generate notes from a topic
router.post("/notes", (req: any, res) => {
  const { topic, subject_id, subject_name } = req.body;

  if (!topic) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  // Generate structured notes based on the topic
  const generatedContent = generateTopicNotes(topic);

  // Create the note
  const noteId = crypto.randomUUID();

  // If a subject_id was provided, use it; otherwise try to find/create a subject
  let targetSubjectId = subject_id || null;

  if (!targetSubjectId && subject_name) {
    const existing = db
      .query("SELECT id FROM subjects WHERE user_id = ? AND name = ?")
      .get(req.userId, subject_name) as { id: string } | undefined;

    if (existing) {
      targetSubjectId = existing.id;
    } else {
      const newId = crypto.randomUUID();
      db.run(
        "INSERT INTO subjects (id, user_id, name, color) VALUES (?, ?, ?, ?)",
        [newId, req.userId, subject_name, "#6366f1"]
      );
      targetSubjectId = newId;
    }
  }

  db.run(
    "INSERT INTO notes (id, user_id, subject_id, title, content) VALUES (?, ?, ?, ?, ?)",
    [noteId, req.userId, targetSubjectId, `${topic} - Study Notes`, generatedContent]
  );

  const note = db
    .query(
      `SELECT n.*, s.name AS subject_name, s.color AS subject_color
       FROM notes n
       LEFT JOIN subjects s ON n.subject_id = s.id
       WHERE n.id = ?`
    )
    .get(noteId) as any;

  res.status(201).json({ note });
});

function generateTopicNotes(topic: string): string {
  // Create structured notes from the topic name
  const topicWords = topic.split(/\s+/);
  const capitalized = topicWords
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `# ${capitalized} - Study Notes

## Overview
${capitalized} is an important topic in this subject area. Understanding its core concepts provides a foundation for further learning and application.

## Key Concepts

### 1. Definition
${capitalized} refers to the fundamental principles and ideas that form the basis of this topic. It encompasses the key elements that are essential for comprehensive understanding.

### 2. Core Principles
- **Principle 1**: The first fundamental concept involves understanding the basic components and their relationships.
- **Principle 2**: The second key principle focuses on the practical applications and real-world implications.
- **Principle 3**: The third essential concept deals with the theoretical framework and its connections to related topics.

## Detailed Analysis

### Theoretical Foundation
The theoretical basis of ${capitalized} rests on several important pillars. These include foundational theories, key research findings, and established methodologies that have been developed over time.

### Practical Applications
${capitalized} has numerous practical applications in real-world scenarios. These applications demonstrate the relevance and importance of understanding this topic thoroughly.

## Important Points to Remember
- The central theme of ${capitalized} revolves around understanding its core components
- Key relationships between different aspects must be carefully studied
- Practical examples help reinforce theoretical concepts
- Regular review of this material will strengthen comprehension

## Study Questions
1. What are the main components of ${capitalized}?
2. How does ${capitalized} relate to other topics in this field?
3. What are the practical applications of the concepts learned?
4. Can you explain the key principles in your own words?
5. What examples can you provide to illustrate these concepts?

## Summary
${capitalized} represents a crucial area of study that requires careful attention to both theoretical concepts and practical applications. Mastering this topic will provide a strong foundation for advanced study.

> "The important thing is not to stop questioning." - Albert Einstein

---
*Generated study notes for: ${topic}*`;
}

export default router;