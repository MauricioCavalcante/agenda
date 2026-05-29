import express from 'express';
import database from '../../database.js';
import { callLLM } from '../services/aiService.js';

const router = express.Router();

// Function to sanitize financial plan JSON structure
function sanitizeFinancialPlan(plan) {
  if (!plan) return { generalNotes: "", suggestedBudgets: [], quests: [] };
  const suggestedBudgets = Array.isArray(plan.suggestedBudgets) ? plan.suggestedBudgets : [];
  const quests = Array.isArray(plan.quests) ? plan.quests : [];
  
  const sanitizedBudgets = suggestedBudgets.map(b => ({
    category: String(b.category || ''),
    limit: parseFloat(b.limit) || 0,
    percent: parseFloat(b.percent) || 0
  }));
  
  const sanitizedQuests = quests.map(q => {
    let targetValue = parseFloat(q.targetValue) || 0;
    let currentValue = parseFloat(q.currentValue) || 0;
    let claimed = !!q.claimed;
    let xp = parseInt(q.xp, 10);
    if (isNaN(xp)) xp = 20;
    
    return {
      id: String(q.id || `quest-fin-${Math.random().toString(36).substr(2, 9)}`),
      title: String(q.title || ''),
      description: String(q.description || ''),
      targetValue: targetValue,
      currentValue: currentValue,
      type: String(q.type || 'expense'), // 'expense' or 'saving'
      claimed: claimed,
      xp: xp
    };
  });
  
  return {
    generalNotes: String(plan.generalNotes || ''),
    suggestedBudgets: sanitizedBudgets,
    quests: sanitizedQuests
  };
}

// Get financial setup details
router.get('/', async (req, res) => {
  try {
    let setup = await database.get("SELECT * FROM financial_setup WHERE id = 1");
    if (!setup) {
      await database.run("INSERT OR IGNORE INTO financial_setup (id, financial_goals, monthly_income, savings_target_percent, ai_plan) VALUES (1, '', 0, 20, '')");
      setup = { financial_goals: '', monthly_income: 0, savings_target_percent: 20, ai_plan: '' };
    }
    if (setup.ai_plan) {
      try {
        const parsed = JSON.parse(setup.ai_plan);
        setup.ai_plan = JSON.stringify(sanitizeFinancialPlan(parsed));
      } catch (e) {
        // ignore JSON parse error
      }
    }
    res.json(setup);
  } catch (err) {
    console.error("Error in GET /api/financial-setup:", err);
    res.status(500).json({ error: "Erro interno ao carregar dados do Financeiro." });
  }
});

// Update financial setup details
router.post('/', async (req, res) => {
  const { financial_goals, monthly_income, savings_target_percent } = req.body;
  try {
    await database.run(
      "UPDATE financial_setup SET financial_goals = ?, monthly_income = ?, savings_target_percent = ? WHERE id = 1",
      [financial_goals || '', parseFloat(monthly_income) || 0, parseFloat(savings_target_percent) || 20]
    );
    res.json({ success: true, message: "Dados financeiros salvos com sucesso." });
  } catch (err) {
    console.error("Error in POST /api/financial-setup:", err);
    res.status(500).json({ error: "Erro interno ao salvar dados financeiros." });
  }
});

// Save financial plan manually
router.post('/save-plan', async (req, res) => {
  const { plan } = req.body;
  try {
    const parsedPlan = typeof plan === 'string' ? JSON.parse(plan) : plan;
    const sanitizedPlan = sanitizeFinancialPlan(parsedPlan);
    await database.run(
      "UPDATE financial_setup SET ai_plan = ? WHERE id = 1",
      [JSON.stringify(sanitizedPlan)]
    );
    res.json({ success: true, message: "Plano de orçamento salvo com sucesso.", plan: sanitizedPlan });
  } catch (err) {
    console.error("Error in POST /api/financial-setup/save-plan:", err);
    res.status(500).json({ error: "Erro interno ao salvar plano de orçamento." });
  }
});

// Generate financial budget plan with AI
router.post('/generate-plan', async (req, res) => {
  try {
    const setup = await database.get("SELECT * FROM financial_setup WHERE id = 1");
    if (!setup) {
      return res.status(400).json({ error: "Nenhum setup financeiro encontrado." });
    }
    const financial_goals = setup.financial_goals || '';
    const monthly_income = setup.monthly_income || 0;
    const savings_target_percent = setup.savings_target_percent || 20;

    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    if (!config || (!config.apiKey && config.provider !== 'ollama')) {
      return res.status(400).json({ error: "Configuração de IA incompleta. Por favor, adicione sua Chave de API nas Configurações." });
    }

    const systemPrompt = `Você é um Mestre de Orçamentos RPG e Assessor Financeiro IA gamificado.
Sua missão é criar um plano de orçamento gamificado e 4 quests financeiras mensais para a Esfera Financeira do usuário.
Você deve considerar a Renda Mensal (monthly_income: R$ ${monthly_income}), a Meta de Economia (savings_target_percent: ${savings_target_percent}%) e as Metas Financeiras descritas pelo usuário.

Regras de Negócio:
1. Calcule o valor em R$ correspondente à meta de economia (aporte).
2. Proponha limites para categorias recomendadas (ex: Aporte / Poupança, Contas / Essenciais, Lazer / Estilo de Vida, Reserva / Outros) sob "suggestedBudgets". Certifique-se de preencher a categoria "Aporte / Poupança" com o valor exato calculado da meta de economia (income * savings_target_percent / 100).
3. Gere EXATAMENTE 4 quests mensais de RPG em "quests". Cada quest deve ter:
   - "id": String única (ex: quest-fin-save, quest-fin-leisure, quest-fin-essential, etc.)
   - "title": Nome curto e divertido estilo quest de RPG.
   - "description": Detalhes em tom de jogo de RPG sobre o que fazer.
   - "targetValue": Valor numérico alvo em R$ (ex: valor a poupar, ou limite de gastos a não ultrapassar).
   - "currentValue": Sempre 0.
   - "type": "saving" se o objetivo for acumular/guardar (o usuário deve ter currentValue >= targetValue) OU "expense" se for um limite de gastos (o usuário deve ter currentValue <= targetValue para manter as despesas controladas).
   - "claimed": false
   - "xp": 20 (base de XP ganho ao concluir).
4. O resultado deve ser retornado EXCLUSIVAMENTE in formato JSON estruturado, sem explicações em texto.

Formato JSON esperado:
{
  "generalNotes": "Dicas rápidas estilo conselhos de taverna do jogo sobre investimentos e controle de gastos baseado nas metas do usuário.",
  "suggestedBudgets": [
    { "category": "Aporte / Poupança", "limit": 600, "percent": 20 },
    { "category": "Contas / Essenciais", "limit": 1500, "percent": 50 },
    { "category": "Lazer / Estilo de Vida", "limit": 600, "percent": 20 },
    { "category": "Reserva / Outros", "limit": 300, "percent": 10 }
  ],
  "quests": [
    {
      "id": "quest-fin-save",
      "title": "💰 Encher o Cofre de Ouro",
      "description": "Deposite a meta de aporte recomendada (R$ 600) na sua conta de investimentos/poupança.",
      "targetValue": 600,
      "currentValue": 0,
      "type": "saving",
      "claimed": false,
      "xp": 20
    },
    {
      "id": "quest-fin-leisure",
      "title": "🍺 Economia na Taverna",
      "description": "Evite gastar mais de R$ 600 no total com saídas, delivery e lazer este mês.",
      "targetValue": 600,
      "currentValue": 0,
      "type": "expense",
      "claimed": false,
      "xp": 20
    }
  ]
}`;

    const userPrompt = `Aqui estão as preferências e objetivos financeiros do usuário:
Renda Mensal: R$ ${monthly_income}
Meta de Economia: ${savings_target_percent}%
Objetivos declarados pelo usuário: "${financial_goals || 'Nenhum objetivo específico informado. Crie um plano básico de sobrevivência financeira.'}"`;

    const rawResponse = await callLLM(config, systemPrompt, userPrompt);
    
    let cleanJsonStr = rawResponse.trim();
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const result = JSON.parse(cleanJsonStr);
    const sanitizedPlan = sanitizeFinancialPlan(result);
    
    // Save to database
    await database.run("UPDATE financial_setup SET ai_plan = ? WHERE id = 1", [JSON.stringify(sanitizedPlan)]);

    res.json({ success: true, plan: sanitizedPlan });
  } catch (error) {
    console.error("AI Financial Plan Generation failed:", error);
    res.status(500).json({ error: `Falha ao gerar orçamento via IA: ${error.message}` });
  }
});

// Claim XP for completed financial quest
router.post('/claim-xp', async (req, res) => {
  const { questId, questTitle, xp } = req.body;
  if (!questId || !questTitle) {
    return res.status(400).json({ error: "Falta ID ou título da quest." });
  }
  const xpAmount = parseInt(xp, 10) || 20;
  
  try {
    // 1. Get setup and verify it has quests in the JSON plan
    const setup = await database.get("SELECT ai_plan FROM financial_setup WHERE id = 1");
    if (!setup || !setup.ai_plan) {
      return res.status(400).json({ error: "Nenhum plano de orçamento ativo encontrado." });
    }
    
    const plan = JSON.parse(setup.ai_plan);
    const quests = plan.quests || [];
    const quest = quests.find(q => q.id === questId);
    if (!quest) {
      return res.status(400).json({ error: "Quest não encontrada no plano de orçamento ativo." });
    }
    
    if (quest.claimed) {
      return res.status(400).json({ error: "O XP para esta Quest de Orçamento já foi resgatado." });
    }
    
    // 2. Mark as claimed
    quest.claimed = true;
    
    // 3. Save updated plan back to database
    await database.run("UPDATE financial_setup SET ai_plan = ? WHERE id = 1", [JSON.stringify(plan)]);
    
    // 4. Update the Financeiro sphere level/XP
    const sphereName = 'Financeiro';
    const sphere = await database.get("SELECT * FROM spheres WHERE name = ?", [sphereName]);
    let newLevel = 1;
    let newXp = xpAmount;
    if (sphere) {
      newXp = sphere.xp + xpAmount;
      newLevel = sphere.level;
      while (newLevel < 100 && newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
      }
      await database.run("UPDATE spheres SET level = ?, xp = ? WHERE name = ?", [newLevel, newXp, sphereName]);
    }
    
    // 5. Insert history record
    const todayStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    await database.run(
      "INSERT INTO history (date, taskId, title, sphere, xpEarned, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [todayStr, questId, `💰 Quest Financeira: ${questTitle}`, sphereName, xpAmount, `Concluiu a quest de orçamento do mês.`, timestamp]
    );
    
    res.json({ success: true, message: "XP resgatado com sucesso!" });
  } catch (err) {
    console.error("Error in POST /api/financial-setup/claim-xp:", err);
    res.status(500).json({ error: "Erro interno ao resgatar XP." });
  }
});

export default router;
