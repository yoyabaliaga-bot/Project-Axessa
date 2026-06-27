import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(import.meta.dir, "../../data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "axessa.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

export function initDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT,
      reminder_time TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reviewer', 'mock_exam')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for common queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_exams_note ON exams(note_id)`);
}

export default db;