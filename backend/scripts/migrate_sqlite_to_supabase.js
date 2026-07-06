import 'dotenv/config';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR, 'agenda.db')
  : path.resolve(__dirname, '../../agenda.db');

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const TARGET_EMAIL = 'mauriciocavalcante.dev@gmail.com';
const TARGET_PASSWORD = 'Hitss@2019'; // Senha solicitada pelo Maurício

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  realtime: {
    transport: ws,
  },
});

const pgPool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) console.error("Could not open SQLite database:", err.message);
});

function fetchAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function migrate() {
  console.log("Criando usuário admin e iniciando migração...");

  try {
    let userId;
    
    // 1. Consultar o banco de dados diretamente para pegar o ID do usuário (fura o rate limit e a confirmação de e-mail)
    const userRes = await pgPool.query("SELECT id FROM auth.users WHERE email = $1", [TARGET_EMAIL]);
    
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log(`Usuário encontrado no banco de dados. ID: ${userId}`);
    } else {
      console.log("Usuário não encontrado no banco. Criando...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
      });

      if (signUpError) {
        throw signUpError;
      }
      userId = signUpData.user.id;
    }

    if (!userId) {
      throw new Error("Não foi possível obter o ID do usuário.");
    }

    console.log(`Usuário validado! ID: ${userId}`);

    // Como o trigger já criou linhas default, precisamos limpar antes de injetar as antigas
    await pgPool.query("DELETE FROM stats WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM spheres WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM ai_config WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM physical_setup WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM financial_setup WHERE user_id = $1", [userId]);
    
    // Limpar as outras tabelas caso o script esteja sendo executado novamente após uma falha parcial
    await pgPool.query("DELETE FROM history WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM schedules WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM user_goals WHERE user_id = $1", [userId]);
    await pgPool.query("DELETE FROM books WHERE user_id = $1", [userId]);

    // 1. Stats
    const stats = await fetchAll("SELECT * FROM stats");
    for (const row of stats) {
      await pgPool.query("INSERT INTO stats (user_id, character_level) VALUES ($1, $2)", [userId, row.character_level]);
    }

    // 2. Spheres
    const spheres = await fetchAll("SELECT * FROM spheres");
    for (const row of spheres) {
      await pgPool.query("INSERT INTO spheres (user_id, name, level, xp) VALUES ($1, $2, $3, $4)", [userId, row.name, row.level, row.xp]);
    }

    // 3. History
    const history = await fetchAll("SELECT * FROM history");
    for (const row of history) {
      await pgPool.query("INSERT INTO history (user_id, date, task, sphere, xp) VALUES ($1, $2, $3, $4, $5)", [
        userId, 
        row.date || new Date().toISOString().split('T')[0], 
        row.task || 'Atividade Legado', 
        row.sphere || 'Pessoal', 
        Math.round(Number(row.xp)) || 0
      ]);
    }

    // 4. Schedules
    const schedules = await fetchAll("SELECT * FROM schedules");
    for (const row of schedules) {
      await pgPool.query(
        "INSERT INTO schedules (user_id, id, title, startTime, endTime, sphere, xp, isMeeting, completed, description, doneAt, parentId) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)", 
        [
          userId, 
          row.id, 
          row.title || 'Agendamento Legado', 
          row.startTime || '00:00', 
          row.endTime || '01:00', 
          row.sphere || 'Pessoal', 
          Math.round(Number(row.xp)) || 10, 
          row.isMeeting ? 1 : 0, 
          row.completed ? 1 : 0, 
          row.description || '', 
          row.doneAt || null, 
          row.parentId || null
        ]
      );
    }

    // 5. User Goals
    const goals = await fetchAll("SELECT * FROM user_goals");
    for (const row of goals) {
      await pgPool.query(
        "INSERT INTO user_goals (user_id, id, title, durationMins, sphere, frequency, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          userId, 
          row.id, 
          row.title || 'Meta Legado', 
          Math.round(Number(row.durationMins)) || 30, 
          row.sphere || 'Pessoal', 
          row.frequency || 'Diário', 
          row.active === undefined ? 1 : (row.active ? 1 : 0)
        ]
      );
    }

    // 6. AI Config
    const aiConfig = await fetchAll("SELECT * FROM ai_config");
    for (const row of aiConfig) {
      await pgPool.query(
        "INSERT INTO ai_config (user_id, provider, apiKey, model, endpoint) VALUES ($1, $2, $3, $4, $5)",
        [userId, row.provider || 'openai', row.apiKey || '', row.model || 'gpt-4o-mini', row.endpoint || 'https://api.openai.com/v1']
      );
    }

    // 7. Physical Setup
    const phys = await fetchAll("SELECT * FROM physical_setup");
    for (const row of phys) {
      await pgPool.query(
        "INSERT INTO physical_setup (user_id, desired_exercises, ai_plan) VALUES ($1, $2, $3)",
        [userId, row.desired_exercises || '', row.ai_plan || '']
      );
    }

    // 8. Financial Setup
    const fin = await fetchAll("SELECT * FROM financial_setup");
    for (const row of fin) {
      await pgPool.query(
        "INSERT INTO financial_setup (user_id, financial_goals, monthly_income, savings_target_percent, ai_plan) VALUES ($1, $2, $3, $4, $5)",
        [userId, row.financial_goals || '', Number(row.monthly_income) || 0, Number(row.savings_target_percent) || 20, row.ai_plan || '']
      );
    }

    // 9. Books
    const books = await fetchAll("SELECT * FROM books");
    for (const row of books) {
      await pgPool.query(
        "INSERT INTO books (user_id, id, title, author, sphere, totalPages, pagesPerDay, targetDate, depth, completed, doneAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [
          userId, 
          row.id, 
          row.title || 'Livro Legado', 
          row.author || '', 
          row.sphere || 'Pessoal', 
          Math.round(Number(row.totalPages)) || 0, 
          Math.round(Number(row.pagesPerDay)) || 0, 
          row.targetDate || '', 
          row.depth || '', 
          row.completed ? 1 : 0, 
          row.doneAt || null
        ]
      );
    }

    console.log("Migração concluída com sucesso!");

  } catch (err) {
    console.error("Erro durante a migração:", err);
  } finally {
    sqliteDb.close();
    pgPool.end();
  }
}

migrate();
