import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import database from '../../database.js';
import { getStatsResponse, recalculateStats } from '../services/statsService.js';
import { generateSchedule } from '../services/aiService.js';
import { parseCronograma } from '../utils/cronogramaParser.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CRONOGRAMA_PATH = process.env.CRONOGRAMA_PATH || path.resolve(__dirname, '../../../cronograma.txt');

// Helper to shift schedules when a meeting is inserted
function shiftScheduleWithMeeting(blocks, startTime, endTime, title, sphere) {
  const parseTimeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatMinutesToTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const mStart = parseTimeToMinutes(startTime);
  const mEnd = parseTimeToMinutes(endTime);
  const mDuration = mEnd - mStart;

  if (mDuration <= 0) return blocks;

  const meetingBlock = {
    id: `meeting-${Date.now()}`,
    startTime,
    endTime,
    duration: `${Math.floor(mDuration / 60)}h${mDuration % 60 ? (mDuration % 60) + 'm' : ''}`,
    title: `📅 [Reunião] ${title}`,
    sphere: sphere || 'Profissional',
    xp: Math.max(5, Math.round((sphere === 'Educacional' ? 15 : 10) * (mDuration / 60))),
    completed: false,
    isMeeting: true
  };

  const newBlocks = [];
  const sortedBlocks = [...blocks].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  for (const block of sortedBlocks) {
    if (block.isMeeting) {
      newBlocks.push(block);
      continue;
    }

    const bStart = parseTimeToMinutes(block.startTime);
    const bEnd = parseTimeToMinutes(block.endTime);

    // Case 1: Block completely before meeting
    if (bEnd <= mStart) {
      newBlocks.push(block);
    }
    // Case 2: Block completely after meeting -> Shift forward
    else if (bStart >= mEnd) {
      newBlocks.push({
        ...block,
        startTime: formatMinutesToTime(bStart + mDuration),
        endTime: formatMinutesToTime(bEnd + mDuration)
      });
    }
    // Case 3: Overlap
    else {
      // Part 1: before meeting
      if (bStart < mStart) {
        const part1Duration = mStart - bStart;
        newBlocks.push({
          ...block,
          id: `${block.id}-part1`,
          endTime: formatMinutesToTime(mStart),
          duration: `${Math.floor(part1Duration / 60)}h${part1Duration % 60 ? (part1Duration % 60) + 'm' : ''}`,
          xp: Math.max(0, Math.round(block.xp * (part1Duration / (bEnd - bStart))))
        });
      }

      // Part 2: after meeting (shifted forward)
      const part2Start = mEnd;
      const originalRemainingDuration = bEnd - Math.max(bStart, mStart);
      const part2End = part2Start + originalRemainingDuration;

      newBlocks.push({
        ...block,
        id: `${block.id}-part2`,
        startTime: formatMinutesToTime(part2Start),
        endTime: formatMinutesToTime(part2End),
        duration: `${Math.floor(originalRemainingDuration / 60)}h${originalRemainingDuration % 60 ? (originalRemainingDuration % 60) + 'm' : ''}`,
        xp: Math.max(0, Math.round(block.xp * (originalRemainingDuration / (bEnd - bStart))))
      });
    }
  }

  newBlocks.push(meetingBlock);
  return newBlocks.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

// Get schedule for a specific date (YYYY-MM-DD)
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  try {
    let tasks = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);

    if (tasks.length === 0) {
      const defaultSchedules = parseCronograma(CRONOGRAMA_PATH);
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

      let baseBlocks = [];
      
      if (dayOfWeek === 1 || dayOfWeek === 4) {
        baseBlocks = defaultSchedules.monday_thursday || [];
      } else if (dayOfWeek === 2) {
        baseBlocks = defaultSchedules.tuesday || [];
      } else if (dayOfWeek === 3 || dayOfWeek === 5) {
        baseBlocks = defaultSchedules.wednesday_friday || [];
      } else if (dayOfWeek === 6) {
        baseBlocks = defaultSchedules.saturday || [];
      }

      // Sunday is free by default
      if (dayOfWeek === 0) {
        await database.run(
          "INSERT INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            `free-${date}-1`,
            date,
            "09:00",
            "22:00",
            "13h",
            "🟢 Fim de Semana Livre! Lazer, descanso e recarga 🏝️",
            "Pessoal",
            15,
            0,
            "",
            null,
            0,
            null
          ]
        );
      } else {
        // Instantiate blocks
        for (let idx = 0; idx < baseBlocks.length; idx++) {
          const block = baseBlocks[idx];
          await database.run(
            "INSERT INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              `task-${date}-${idx}`,
              date,
              block.startTime,
              block.endTime,
              block.duration,
              block.title,
              block.sphere,
              block.xp,
              0,
              "",
              null,
              0,
              null
            ]
          );
        }
      }
      tasks = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);
    }

    res.json(tasks.map(t => ({
      ...t,
      completed: !!t.completed,
      isMeeting: !!t.isMeeting
    })));
  } catch (err) {
    console.error("Error in GET /api/schedule:", err);
    res.status(500).json({ error: "Erro interno ao carregar o cronograma." });
  }
});

// Complete a task block
router.post('/complete', async (req, res) => {
  const { date, taskId, description } = req.body;
  if (!date || !taskId) {
    return res.status(400).json({ error: "Missing date or taskId" });
  }

  try {
    const block = await database.get("SELECT * FROM schedules WHERE id = ? AND date = ?", [taskId, date]);
    if (!block) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (block.completed) {
      return res.status(400).json({ error: "Task already completed" });
    }

    const doneAt = new Date().toISOString();
    const taskDesc = description || "Atividade concluída com sucesso!";

    // Start database operations in transaction
    await database.run("BEGIN TRANSACTION");
    try {
      // Mark task as completed
      await database.run(
        "UPDATE schedules SET completed = 1, description = ?, doneAt = ? WHERE id = ? AND date = ?",
        [taskDesc, doneAt, taskId, date]
      );

      // Apply XP to sphere
      const sphere = await database.get("SELECT * FROM spheres WHERE name = ?", [block.sphere]);
      if (sphere) {
        let newXp = sphere.xp + block.xp;
        let newLevel = sphere.level;
        while (newLevel < 100 && newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
        }
        await database.run("UPDATE spheres SET level = ?, xp = ? WHERE name = ?", [newLevel, newXp, block.sphere]);
      }

      // Add to history
      await database.run(
        "INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [date, taskId, block.title, block.sphere, block.xp, taskDesc, doneAt]
      );

      // Re-calculate character level
      const spheres = await database.all("SELECT level FROM spheres");
      const totalSpheresLevel = spheres.reduce((sum, s) => sum + s.level, 0);
      const charLevel = Math.floor(totalSpheresLevel / (spheres.length || 1));
      await database.run("UPDATE stats SET character_level = ? WHERE id = 1", [charLevel]);

      await database.run("COMMIT");
    } catch (transErr) {
      await database.run("ROLLBACK");
      throw transErr;
    }

    const stats = await getStatsResponse();
    const updatedTask = {
      ...block,
      completed: true,
      description: taskDesc,
      doneAt
    };

    res.json({
      success: true,
      task: updatedTask,
      stats
    });
  } catch (err) {
    console.error("Error in POST /api/schedule/complete:", err);
    res.status(500).json({ error: "Erro interno ao concluir atividade." });
  }
});

// Reschedule due to a meeting (Insert meeting and shift times)
router.post('/reschedule', async (req, res) => {
  const { date, startTime, endTime, title, sphere } = req.body;
  if (!date || !startTime || !endTime || !title) {
    return res.status(400).json({ error: "Missing required fields (date, startTime, endTime, title)" });
  }

  try {
    const blocks = await database.all("SELECT * FROM schedules WHERE date = ?", [date]);
    if (blocks.length === 0) {
      return res.status(400).json({ error: "Please load the schedule for this day first" });
    }

    const mappedBlocks = blocks.map(b => ({
      ...b,
      completed: !!b.completed,
      isMeeting: !!b.isMeeting
    }));

    const updatedBlocks = shiftScheduleWithMeeting(mappedBlocks, startTime, endTime, title, sphere);

    await database.run("BEGIN TRANSACTION");
    try {
      await database.run("DELETE FROM schedules WHERE date = ?", [date]);
      for (const block of updatedBlocks) {
        await database.run(
          "INSERT INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            block.id,
            date,
            block.startTime,
            block.endTime,
            block.duration || '',
            block.title,
            block.sphere,
            block.xp || 0,
            block.completed ? 1 : 0,
            block.description || '',
            block.doneAt || null,
            block.isMeeting ? 1 : 0,
            block.parentId || null
          ]
        );
      }
      await database.run("COMMIT");
    } catch (errTrans) {
      await database.run("ROLLBACK");
      throw errTrans;
    }

    res.json(updatedBlocks);
  } catch (err) {
    console.error("Error in POST /api/schedule/reschedule:", err);
    res.status(500).json({ error: "Erro interno ao reorganizar horários." });
  }
});

// Add a new task manually
router.post('/add-task', async (req, res) => {
  const { date, startTime, endTime, title, sphere, xp } = req.body;
  if (!date || !startTime || !endTime || !title || !sphere) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const parseTimeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const durationMins = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    const duration = durationMins > 0 ? `${Math.floor(durationMins / 60)}h${durationMins % 60 ? (durationMins % 60) + 'm' : ''}` : '';

    let taskXp = parseInt(xp, 10);
    if (isNaN(taskXp)) {
      const rate = (sphere === 'Educacional' || sphere === 'Profissional') ? 15 : 10;
      const hours = durationMins > 0 ? durationMins / 60 : 1.0;
      taskXp = Math.max(5, Math.round(rate * hours));
    }

    const taskId = `custom-${Date.now()}`;
    await database.run(
      "INSERT INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [taskId, date, startTime, endTime, duration, title, sphere, taskXp, 0, "", null, 0, null]
    );

    const list = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);
    res.json(list.map(t => ({
      ...t,
      completed: !!t.completed,
      isMeeting: !!t.isMeeting
    })));
  } catch (err) {
    console.error("Error in POST /api/schedule/add-task:", err);
    res.status(500).json({ error: "Erro interno ao adicionar atividade fixa." });
  }
});

// Edit an existing task (any details)
router.post('/edit-task', async (req, res) => {
  const { date, taskId, title, startTime, endTime, sphere, xp, description, completed, parentId } = req.body;
  if (!date || !taskId) {
    return res.status(400).json({ error: "Missing date or taskId" });
  }

  try {
    const block = await database.get("SELECT * FROM schedules WHERE id = ? AND date = ?", [taskId, date]);
    if (!block) {
      return res.status(404).json({ error: "Task not found" });
    }

    let finalCompleted = block.completed;
    let finalDoneAt = block.doneAt;
    let finalDesc = block.description;

    if (completed !== undefined && completed !== !!block.completed) {
      finalCompleted = completed ? 1 : 0;
      if (completed) {
        finalDoneAt = new Date().toISOString();
        finalDesc = description || "Atividade concluída com sucesso!";
      } else {
        finalDoneAt = null;
        finalDesc = "";
      }
    } else if (completed && description !== undefined) {
      finalDesc = description;
    }

    const finalTitle = title !== undefined ? title : block.title;
    const finalStart = startTime !== undefined ? startTime : block.startTime;
    const finalEnd = endTime !== undefined ? endTime : block.endTime;
    const finalSphere = sphere !== undefined ? sphere : block.sphere;
    const finalXp = xp !== undefined ? Number(xp) : block.xp;
    const finalParentId = parentId !== undefined ? parentId : block.parentId;

    let finalDuration = block.duration;
    if (startTime !== undefined || endTime !== undefined) {
      const parseTimeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };
      const durationMins = parseTimeToMinutes(finalEnd) - parseTimeToMinutes(finalStart);
      finalDuration = durationMins > 0 ? `${Math.floor(durationMins / 60)}h${durationMins % 60 ? (durationMins % 60) + 'm' : ''}` : '';
    }

    await database.run(
      "UPDATE schedules SET title = ?, startTime = ?, endTime = ?, duration = ?, sphere = ?, xp = ?, completed = ?, description = ?, doneAt = ?, parentId = ? WHERE id = ? AND date = ?",
      [finalTitle, finalStart, finalEnd, finalDuration, finalSphere, finalXp, finalCompleted, finalDesc, finalDoneAt, finalParentId, taskId, date]
    );

    // Recalculate all stats and history to stay completely consistent
    await recalculateStats();

    const list = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);
    const stats = await getStatsResponse();

    res.json({
      success: true,
      schedule: list.map(t => ({
        ...t,
        completed: !!t.completed,
        isMeeting: !!t.isMeeting
      })),
      stats
    });
  } catch (err) {
    console.error("Error in POST /api/schedule/edit-task:", err);
    res.status(500).json({ error: "Erro interno ao salvar edição da atividade." });
  }
});

// Delete an existing task
router.post('/delete-task', async (req, res) => {
  const { date, taskId } = req.body;
  if (!date || !taskId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    await database.run("DELETE FROM schedules WHERE id = ? AND date = ?", [taskId, date]);
    await recalculateStats();

    const list = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);
    const stats = await getStatsResponse();

    res.json({
      success: true,
      schedule: list.map(t => ({
        ...t,
        completed: !!t.completed,
        isMeeting: !!t.isMeeting
      })),
      stats
    });
  } catch (err) {
    console.error("Error in POST /api/schedule/delete-task:", err);
    res.status(500).json({ error: "Erro interno ao excluir atividade." });
  }
});

// AI Schedule Reorganizer
router.post('/generate-ai', async (req, res) => {
  const { date, note } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  try {
    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    if (!config || (!config.apiKey && config.provider !== 'ollama')) {
      return res.status(400).json({ error: "Configuração de IA incompleta. Por favor, adicione sua Chave de API nas Configurações." });
    }

    // Get current schedule for that date (or default if empty)
    let currentTasks = await database.all("SELECT * FROM schedules WHERE date = ? ORDER BY startTime ASC", [date]);
    if (currentTasks.length === 0) {
      const defaultSchedules = parseCronograma(CRONOGRAMA_PATH);
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      let baseBlocks = [];
      
      if (dayOfWeek === 1 || dayOfWeek === 4) {
        baseBlocks = defaultSchedules.monday_thursday || [];
      } else if (dayOfWeek === 2) {
        baseBlocks = defaultSchedules.tuesday || [];
      } else if (dayOfWeek === 3 || dayOfWeek === 5) {
        baseBlocks = defaultSchedules.wednesday_friday || [];
      } else if (dayOfWeek === 6) {
        baseBlocks = defaultSchedules.saturday || [];
      }
      
      if (dayOfWeek === 0) {
        currentTasks = [
          {
            id: `free-${date}-1`,
            startTime: "09:00",
            endTime: "22:00",
            duration: "13h",
            title: "🟢 Fim de Semana Livre! Lazer, descanso e recarga 🏝️",
            sphere: "Pessoal",
            xp: 15,
            completed: false
          }
        ];
      } else {
        currentTasks = baseBlocks.map((block, idx) => {
          return {
            id: `task-${date}-${idx}`,
            startTime: block.startTime,
            endTime: block.endTime,
            duration: block.duration,
            title: block.title,
            sphere: block.sphere,
            xp: block.xp,
            completed: false,
            description: ""
          };
        });
      }
    } else {
      currentTasks = currentTasks.map(t => ({
        ...t,
        completed: !!t.completed,
        isMeeting: !!t.isMeeting
      }));
    }

    const activeGoals = await database.all("SELECT * FROM user_goals WHERE active = 1");
    const physicalSetup = await database.get("SELECT * FROM physical_setup WHERE id = 1");

    const result = await generateSchedule(config, date, currentTasks, activeGoals, physicalSetup, note);

    if (!result.schedule || !Array.isArray(result.schedule)) {
      throw new Error("Invalid response format: 'schedule' array not found.");
    }

    // Map LLM-generated IDs to unique IDs
    const idMap = {};
    const usedOriginalIds = new Set();
    const usedTargetIds = new Set();

    const mappedTasks = result.schedule.map(newTask => {
      const original = currentTasks.find(o => 
        !usedOriginalIds.has(o.id) && 
        (o.id === newTask.id || o.title === newTask.title)
      );
      
      let targetId = '';
      if (original) {
        targetId = original.id;
        usedOriginalIds.add(original.id);
      } else {
        do {
          targetId = `task-${date}-${Math.random().toString(36).substr(2, 9)}`;
        } while (usedTargetIds.has(targetId));
      }
      usedTargetIds.add(targetId);
      idMap[newTask.id] = targetId;
      
      return {
        ...newTask,
        originalId: newTask.id,
        id: targetId,
        completed: original ? (original.completed ? 1 : 0) : 0,
        description: original ? (original.description || "") : "",
        doneAt: original ? (original.doneAt || null) : null,
        isMeeting: (original ? (original.isMeeting ? 1 : 0) : 0) || (newTask.title.includes('Reunião') || newTask.title.includes('[Reunião]') ? 1 : 0)
      };
    });

    const updatedTasks = mappedTasks.map(t => {
      let parentId = t.parentId;
      if (parentId && idMap[parentId]) {
        parentId = idMap[parentId];
      }
      return {
        id: t.id,
        date: date,
        startTime: t.startTime,
        endTime: t.endTime,
        duration: t.duration,
        title: t.title,
        sphere: t.sphere,
        xp: t.xp,
        completed: t.completed,
        description: t.description,
        doneAt: t.doneAt,
        isMeeting: t.isMeeting ? 1 : 0,
        parentId: parentId || null
      };
    });

    const parseTimeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    updatedTasks.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    await database.run("BEGIN TRANSACTION");
    try {
      await database.run("DELETE FROM schedules WHERE date = ?", [date]);
      for (const block of updatedTasks) {
        await database.run(
          "INSERT INTO schedules (id, date, startTime, endTime, duration, title, sphere, xp, completed, description, doneAt, isMeeting, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            block.id,
            date,
            block.startTime,
            block.endTime,
            block.duration || '',
            block.title,
            block.sphere,
            block.xp || 0,
            block.completed ? 1 : 0,
            block.description || '',
            block.doneAt || null,
            block.isMeeting ? 1 : 0,
            block.parentId || null
          ]
        );
      }
      await database.run("COMMIT");
    } catch (errTrans) {
      await database.run("ROLLBACK");
      throw errTrans;
    }

    res.json(updatedTasks.map(t => ({
      ...t,
      completed: !!t.completed,
      isMeeting: !!t.isMeeting
    })));

  } catch (error) {
    console.error("AI Generation failed:", error);
    res.status(500).json({ error: `Falha na geração de cronograma via IA: ${error.message}` });
  }
});

export default router;
