import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'agenda.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log(`Connected to SQLite database at ${DB_PATH}`);
  }
});

// Helper wrapper functions for async/await
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Close helper
export function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Initialize tables schema
export async function initSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS spheres (
      name TEXT PRIMARY KEY,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      taskId TEXT NOT NULL,
      title TEXT NOT NULL,
      sphere TEXT NOT NULL,
      xpEarned INTEGER NOT NULL,
      description TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration TEXT,
      title TEXT NOT NULL,
      sphere TEXT NOT NULL,
      xp INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      description TEXT,
      doneAt TEXT,
      isMeeting INTEGER DEFAULT 0,
      parentId TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_config (
      provider TEXT PRIMARY KEY,
      apiKey TEXT,
      model TEXT,
      apiEndpoint TEXT
    );

    CREATE TABLE IF NOT EXISTS user_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      durationMins INTEGER NOT NULL,
      sphere TEXT NOT NULL,
      frequency TEXT NOT NULL,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS physical_setup (
      id INTEGER PRIMARY KEY DEFAULT 1,
      desired_exercises TEXT,
      ai_plan TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_setup (
      id INTEGER PRIMARY KEY DEFAULT 1,
      financial_goals TEXT,
      monthly_income REAL DEFAULT 0,
      savings_target_percent REAL DEFAULT 20,
      ai_plan TEXT
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      sphere TEXT NOT NULL,
      pages INTEGER,
      goal TEXT,
      depth TEXT,
      xp INTEGER DEFAULT 0,
      xp_reason TEXT,
      completed INTEGER DEFAULT 0,
      doneAt TEXT
    );
  `;
  await exec(schema);

  // Seed initial stats if not existing
  const statsCount = await get("SELECT COUNT(*) as count FROM stats");
  if (statsCount.count === 0) {
    await run("INSERT INTO stats (character_level) VALUES (1)");
  }

  // Seed initial spheres if not existing
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Profissional', 1, 0)");
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Educacional', 1, 0)");
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Pessoal', 1, 0)");
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Físico', 1, 0)");
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Financeiro', 1, 0)");
  await run("INSERT OR IGNORE INTO spheres (name, level, xp) VALUES ('Social', 1, 0)");

  // Seed default ai_config if not existing
  const aiCount = await get("SELECT COUNT(*) as count FROM ai_config");
  if (aiCount.count === 0) {
    await run("INSERT INTO ai_config (provider, apiKey, model, apiEndpoint) VALUES ('openai', '', 'gpt-4o-mini', 'https://api.openai.com/v1')");
  }

  // Seed initial physical_setup if not existing
  const physCount = await get("SELECT COUNT(*) as count FROM physical_setup");
  if (physCount.count === 0) {
    await run("INSERT INTO physical_setup (id, desired_exercises, ai_plan) VALUES (1, '', '')");
  }

  // Seed initial financial_setup if not existing
  const finSetupCount = await get("SELECT COUNT(*) as count FROM financial_setup");
  if (finSetupCount.count === 0) {
    await run("INSERT INTO financial_setup (id, financial_goals, monthly_income, savings_target_percent, ai_plan) VALUES (1, '', 0, 20, '')");
  }
}

export default {
  run,
  get,
  all,
  exec,
  close,
  initSchema,
  DB_PATH
};
