import express from 'express';
import database from '../../database.js';

const router = express.Router();

// Get AI configuration
router.get('/ai-config', async (req, res) => {
  try {
    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    const maskedConfig = {
      provider: config?.provider || 'openai',
      apiKey: config?.apiKey ? '*****' : '',
      model: config?.model || 'gpt-4o-mini',
      apiEndpoint: config?.apiEndpoint || 'https://api.openai.com/v1'
    };
    res.json(maskedConfig);
  } catch (err) {
    console.error("Error in GET /api/ai-config:", err);
    res.status(500).json({ error: "Erro interno ao carregar configuração de IA." });
  }
});

// Update AI configuration
router.post('/ai-config', async (req, res) => {
  const { provider, apiKey, model, apiEndpoint } = req.body;
  if (!provider || !model) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const current = await database.get("SELECT apiKey FROM ai_config WHERE provider = ?", [provider]);
    let keyToSave = apiKey;
    if (apiKey === '*****') {
      keyToSave = current ? current.apiKey : '';
    } else if (apiKey === '') {
      keyToSave = '';
    }

    await database.run(
      "INSERT OR REPLACE INTO ai_config (provider, apiKey, model, apiEndpoint) VALUES (?, ?, ?, ?)",
      [provider, keyToSave || '', model, apiEndpoint || '']
    );
    res.json({ success: true, message: "AI Configuration updated successfully" });
  } catch (err) {
    console.error("Error in POST /api/ai-config:", err);
    res.status(500).json({ error: "Erro interno ao salvar configurações de IA." });
  }
});

// Get calendar daily XP details
router.get('/calendar-xp', async (req, res) => {
  try {
    const rows = await database.all("SELECT date, SUM(xpEarned) as totalXp FROM history GROUP BY date");
    const xpMap = {};
    rows.forEach(item => {
      if (item.date) {
        xpMap[item.date] = item.totalXp;
      }
    });
    res.json(xpMap);
  } catch (err) {
    console.error("Error in GET /api/calendar-xp:", err);
    res.status(500).json({ error: "Erro interno ao carregar evolução do calendário." });
  }
});

// Get completion history log
router.get('/history', async (req, res) => {
  try {
    const list = await database.all("SELECT * FROM history ORDER BY timestamp DESC");
    res.json(list.map(h => ({
      ...h,
      xpEarned: Number(h.xpEarned)
    })));
  } catch (err) {
    console.error("Error in GET /api/history:", err);
    res.status(500).json({ error: "Erro interno ao carregar o histórico." });
  }
});

export default router;
