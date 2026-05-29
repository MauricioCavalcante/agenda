import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const JSON_DB_PATH = path.join(DATA_DIR, 'agenda_db.json');
const BACKUP_DB_PATH = path.join(DATA_DIR, 'agenda_db.json.bak');

export async function checkAndMigrate() {
  console.log("Checking database schema initialization...");
  await db.initSchema();

  if (!fs.existsSync(JSON_DB_PATH)) {
    console.log("No JSON database found or migration already completed.");
    try {
      await migrateGoalsFromCronograma();
    } catch (errGoals) {
      console.error("Failed to seed goals from cronograma.txt:", errGoals);
    }
    return;
  }

  console.log(`JSON database found at ${JSON_DB_PATH}. Starting migration...`);
  try {
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    const data = JSON.parse(raw);

    // 1. Migrate Stats
    if (data.stats) {
      const charLevel = Math.floor(
        ((data.stats.spheres?.Profissional?.level || 1) +
         (data.stats.spheres?.Educacional?.level || 1) +
         (data.stats.spheres?.Pessoal?.level || 1)) / 3
      );
      await db.run("UPDATE stats SET character_level = ? WHERE id = 1", [charLevel || 1]);

      if (data.stats.spheres) {
        for (const [name, sphere] of Object.entries(data.stats.spheres)) {
          await db.run(
            "INSERT OR REPLACE INTO spheres (name, level, xp) VALUES (?, ?, ?)",
            [name, sphere.level || 1, sphere.xp || 0]
          );
        }
      }
      console.log("Migrated stats and spheres.");
    }

    // 2. Migrate AI Config
    if (data.aiConfig) {
      const cfg = data.aiConfig;
      await db.run(
        "INSERT OR REPLACE INTO ai_config (provider, apiKey, model, apiEndpoint) VALUES (?, ?, ?, ?)",
        [cfg.provider || 'openai', cfg.apiKey || '', cfg.model || 'gpt-4o-mini', cfg.apiEndpoint || 'https://api.openai.com/v1']
      );
      console.log("Migrated AI Config.");
    }

    // 3. Migrate User Goals
    if (Array.isArray(data.userGoals)) {
      for (const goal of data.userGoals) {
        await db.run(
          "INSERT OR REPLACE INTO user_goals (id, title, durationMins, sphere, frequency, active) VALUES (?, ?, ?, ?, ?, ?)",
          [goal.id, goal.title, Number(goal.durationMins), goal.sphere, goal.frequency, goal.active !== false ? 1 : 0]
        );
      }
      console.log(`Migrated ${data.userGoals.length} user goals.`);
    }

    // 4. Migrate Schedules (Tasks)
    let taskCount = 0;
    if (data.schedules) {
      for (const [dateStr, tasks] of Object.entries(data.schedules)) {
        if (!Array.isArray(tasks)) continue;
        for (const t of tasks) {
          await db.run(
            "INSERT OR REPLACE INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              t.id,
              dateStr,
              t.startTime,
              t.endTime,
              t.duration || '',
              t.title,
              t.sphere,
              t.xp || 0,
              t.completed ? 1 : 0,
              t.description || '',
              t.doneAt || null,
              t.isMeeting ? 1 : 0,
              t.parentId || null
            ]
          );
          taskCount++;
        }
      }
      console.log(`Migrated ${taskCount} schedule task instances.`);
    }

    // 5. Migrate History Logs
    if (Array.isArray(data.history)) {
      for (const item of data.history) {
        await db.run(
          "INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            item.date,
            item.taskId,
            item.title,
            item.sphere,
            item.xpEarned || 0,
            item.description || '',
            item.timestamp || new Date().toISOString()
          ]
        );
      }
      console.log(`Migrated ${data.history.length} history records.`);
    }

    // 6. Rename JSON database to .bak
    fs.renameSync(JSON_DB_PATH, BACKUP_DB_PATH);
    console.log(`Successfully migrated database. Old file backup saved to ${BACKUP_DB_PATH}`);

  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    try {
      await migrateGoalsFromCronograma();
    } catch (errGoals) {
      console.error("Failed to seed goals from cronograma.txt:", errGoals);
    }
  }
}

export async function migrateGoalsFromCronograma() {
  const CRONOGRAMA_PATH = process.env.CRONOGRAMA_PATH || path.resolve(__dirname, '../cronograma.txt');
  if (!fs.existsSync(CRONOGRAMA_PATH)) {
    console.log("Cronograma file not found. Skipping goals seeding.");
    return;
  }

  console.log(`Reading cronograma from ${CRONOGRAMA_PATH} to extract recurring goals...`);
  const content = fs.readFileSync(CRONOGRAMA_PATH, 'utf-8');
  const lines = content.split('\n');

  let currentSection = null;
  const dayWeights = {
    'monday_thursday': ['Segunda', 'Quinta'],
    'tuesday': ['Terça'],
    'wednesday_friday': ['Quarta', 'Sexta'],
    'saturday': ['Sábado']
  };

  const parsedTasks = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.includes('Segunda e Quinta-Feira')) {
      currentSection = 'monday_thursday';
      continue;
    } else if (line.includes('Terça-Feira')) {
      currentSection = 'tuesday';
      continue;
    } else if (line.includes('Quarta e Sexta-Feira')) {
      currentSection = 'wednesday_friday';
      continue;
    } else if (line.includes('Sábado')) {
      currentSection = 'saturday';
      continue;
    } else if (line.includes('Resumo da sua Carga Semanal') || line.includes('Carga Semanal')) {
      currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    const timeMatch = line.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*(?:\(([^)]+)\))?:\s*(.*)$/);
    if (timeMatch) {
      const [_, startTime, endTime, durationStr, rawTitle] = timeMatch;
      const title = rawTitle.trim();
      
      const titleLower = title.toLowerCase();
      if (
        titleLower.includes('almoço') || 
        titleLower.includes('almoco') || 
        titleLower.includes('descanso') || 
        titleLower.includes('livre') || 
        titleLower.includes('buffer')
      ) {
        continue;
      }

      const parseTimeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };
      const startMins = parseTimeToMinutes(startTime);
      const endMins = parseTimeToMinutes(endTime);
      const durationMins = endMins - startMins;

      let sphere = 'Pessoal';
      if (titleLower.includes('clt') || titleLower.includes('hitss')) {
        sphere = 'Profissional';
      } else if (titleLower.includes('projeto') || titleLower.includes('iapostlab')) {
        sphere = 'Profissional';
      } else if (titleLower.includes('estudo') || titleLower.includes('graduação') || titleLower.includes('pós') || titleLower.includes('pos-') || titleLower.includes('mentoria')) {
        sphere = 'Educacional';
      } else if (titleLower.includes('leitura')) {
        sphere = 'Pessoal';
      } else if (titleLower.includes('exercício') || titleLower.includes('atividade física') || titleLower.includes('treino')) {
        sphere = 'Físico';
      } else if (titleLower.includes('finança') || titleLower.includes('financeiro') || titleLower.includes('investimento') || titleLower.includes('orçamento')) {
        sphere = 'Financeiro';
      }

      parsedTasks.push({
        title,
        durationMins,
        sphere,
        days: dayWeights[currentSection]
      });
    }
  }

  const cleanGoalTitle = (t) => {
    let clean = t.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    clean = clean.replace(/^[^\w\sÀ-ÿ:]/gu, '').trim();
    clean = clean.split('- Bloco')[0].trim();
    clean = clean.replace(/\([^)]+\)/g, '').trim();
    return clean;
  };

  const groups = {};
  for (const task of parsedTasks) {
    const cleaned = cleanGoalTitle(task.title);
    if (!groups[cleaned]) {
      groups[cleaned] = {
        title: cleaned,
        sphere: task.sphere,
        dailySums: {}
      };
    }
    for (const day of task.days) {
      groups[cleaned].dailySums[day] = (groups[cleaned].dailySums[day] || 0) + task.durationMins;
    }
  }

  const uniqueGoals = [];
  for (const key of Object.keys(groups)) {
    const grp = groups[key];
    const days = Object.keys(grp.dailySums);
    const daysCount = days.length;
    const dailyDuration = Math.max(...Object.values(grp.dailySums));

    let frequency = '3x por semana';
    if (daysCount >= 5) {
      frequency = 'Somente dias úteis';
    } else if (daysCount === 4) {
      frequency = 'Todos os dias';
    } else if (grp.dailySums['Sábado'] && daysCount === 1) {
      frequency = 'Somente finais de semana';
    }

    uniqueGoals.push({
      id: `goal-${key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: key,
      durationMins: dailyDuration,
      sphere: grp.sphere,
      frequency
    });
  }

  for (const goal of uniqueGoals) {
    await db.run(
      "INSERT OR REPLACE INTO user_goals (id, title, durationMins, sphere, frequency, active) VALUES (?, ?, ?, ?, ?, 1)",
      [goal.id, goal.title, goal.durationMins, goal.sphere, goal.frequency]
    );
  }

  console.log(`Successfully migrated ${uniqueGoals.length} recurring goals from cronograma.txt`);
}
