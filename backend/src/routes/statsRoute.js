import express from 'express';
import { getStatsResponse, recalculateStats } from '../services/statsService.js';
import database from '../../database.js';

const router = express.Router();

// Get statistics
router.get('/', async (req, res) => {
  try {
    const stats = await getStatsResponse();
    res.json(stats);
  } catch (err) {
    console.error("Error in GET /api/stats:", err);
    res.status(500).json({ error: "Erro interno do servidor ao carregar estatísticas." });
  }
});

// Reset stats data
router.post('/reset', async (req, res) => {
  try {
    // Reset basic level and spheres to zero, clear schedule entries status
    await database.run("UPDATE stats SET character_level = 1 WHERE id = 1");
    await database.run("UPDATE spheres SET level = 1, xp = 0");
    await database.run("DELETE FROM history");
    await database.run("UPDATE schedules SET completed = 0, description = '', doneAt = null");
    await database.run("UPDATE books SET completed = 0, doneAt = null");

    // Also update any active plans in physical and financial setups to reset counts
    const physSetup = await database.get("SELECT ai_plan FROM physical_setup WHERE id = 1");
    if (physSetup && physSetup.ai_plan) {
      try {
        const parsed = JSON.parse(physSetup.ai_plan);
        if (parsed.workouts) {
          parsed.workouts.forEach(w => {
            if (w.exercises) {
              w.exercises.forEach(ex => {
                ex.doneExecutions = 0;
              });
            }
          });
          await database.run("UPDATE physical_setup SET ai_plan = ? WHERE id = 1", [JSON.stringify(parsed)]);
        }
      } catch (errParse) {
        console.warn("Could not parse physical setup during reset:", errParse);
      }
    }

    const finSetup = await database.get("SELECT ai_plan FROM financial_setup WHERE id = 1");
    if (finSetup && finSetup.ai_plan) {
      try {
        const parsed = JSON.parse(finSetup.ai_plan);
        if (parsed.quests) {
          parsed.quests.forEach(q => {
            q.currentValue = 0;
            q.claimed = false;
          });
          await database.run("UPDATE financial_setup SET ai_plan = ? WHERE id = 1", [JSON.stringify(parsed)]);
        }
      } catch (errParse) {
        console.warn("Could not parse financial setup during reset:", errParse);
      }
    }

    await recalculateStats();
    res.json({ success: true, message: "Stats reset completed successfully" });
  } catch (err) {
    console.error("Error in POST /api/stats/reset:", err);
    res.status(500).json({ error: "Erro interno ao reiniciar dados." });
  }
});

export default router;
