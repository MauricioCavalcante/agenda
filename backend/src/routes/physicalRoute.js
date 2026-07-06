/**
 * Esfera Física (Corpo)
 * 
 * Responsável por gerenciar os treinos gerados pela IA e a progressão dos exercícios no perfil do usuário.
 */
import express from 'express';
import database from '../../database.js';
import { callLLM } from '../services/aiService.js';
import { decryptKey } from '../utils/crypto.js';

const router = express.Router();

/** Sanitiza e formata os nós do plano de treino em JSON. */
function sanitizePhysicalPlan(plan) {
  if (!plan) return { generalNotes: "", workouts: [] };
  const workouts = Array.isArray(plan.workouts) ? plan.workouts : [];
  const sanitizedWorkouts = workouts.map(workout => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const sanitizedExercises = exercises.map(ex => {
      let targetExecutions = parseInt(ex.targetExecutions, 10);
      if (isNaN(targetExecutions)) {
        // Try to extract first number from reps (e.g. "10 a 15" -> 10, "15" -> 15)
        const match = String(ex.reps || '').match(/\d+/);
        targetExecutions = match ? parseInt(match[0], 10) : 10;
      }
      
      let doneExecutions = parseInt(ex.doneExecutions, 10);
      if (isNaN(doneExecutions)) {
        doneExecutions = 0;
      }
      
      let sets = parseInt(ex.sets, 10);
      if (isNaN(sets)) {
        sets = 3;
      }
      
      return {
        name: String(ex.name || ''),
        sets: sets,
        reps: String(ex.reps || ''),
        targetExecutions: targetExecutions,
        doneExecutions: doneExecutions,
        notes: String(ex.notes || '')
      };
    });
    
    return {
      title: String(workout.title || ''),
      description: String(workout.description || ''),
      exercises: sanitizedExercises
    };
  });
  
  return {
    generalNotes: String(plan.generalNotes || ''),
    workouts: sanitizedWorkouts
  };
}

/** GET / - Retorna as preferências do usuário e o seu plano de treino atual. */
router.get('/', async (req, res) => {
  try {
    let setup = await database.get("SELECT * FROM physical_setup LIMIT 1");
    if (!setup) {
      setup = { desired_exercises: '', ai_plan: '' };
    }
    // Return setup with sanitized ai_plan if parsed successfully
    if (setup.ai_plan) {
      try {
        const parsed = JSON.parse(setup.ai_plan);
        setup.ai_plan = JSON.stringify(sanitizePhysicalPlan(parsed));
      } catch (e) {
        // ignore JSON parse error
      }
    }
    res.json(setup);
  } catch (err) {
    console.error("Error in GET /api/physical-setup:", err);
    res.status(500).json({ error: "Erro interno ao carregar dados do Físico." });
  }
});

/** POST / - Salva exercícios ou foco específicos do usuário. */
router.post('/', async (req, res) => {
  const { desired_exercises } = req.body;
  try {
    const result = await database.run(
      "UPDATE physical_setup SET desired_exercises = ?",
      [desired_exercises || '']
    );
    if (result.changes === 0) {
      await database.run(
        "INSERT INTO physical_setup (desired_exercises, ai_plan) VALUES (?, '')",
        [desired_exercises || '']
      );
    }
    res.json({ success: true, message: "Exercícios desejados salvos com sucesso." });
  } catch (err) {
    console.error("Error in POST /api/physical-setup:", err);
    res.status(500).json({ error: "Erro interno ao salvar exercícios desejados." });
  }
});

/** POST /save-plan - Atualiza manualmente o JSON (usado para salvar progresso de treino, ex: completou 3 de 10 reps). */
router.post('/save-plan', async (req, res) => {
  const { plan } = req.body;
  try {
    const parsedPlan = typeof plan === 'string' ? JSON.parse(plan) : plan;
    const sanitizedPlan = sanitizePhysicalPlan(parsedPlan);
    const result = await database.run(
      "UPDATE physical_setup SET ai_plan = ?",
      [JSON.stringify(sanitizedPlan)]
    );
    if (result.changes === 0) {
      await database.run(
        "INSERT INTO physical_setup (desired_exercises, ai_plan) VALUES ('', ?)",
        [JSON.stringify(sanitizedPlan)]
      );
    }
    res.json({ success: true, message: "Plano de treino salvo com sucesso.", plan: sanitizedPlan });
  } catch (err) {
    console.error("Error in POST /api/physical-setup/save-plan:", err);
    res.status(500).json({ error: "Erro interno ao salvar plano de treino." });
  }
});

/** POST /generate-plan - Aciona a IA (Personal Trainer) para desenvolver uma rotina de treino customizada. */
router.post('/generate-plan', async (req, res) => {
  try {
    const setup = await database.get("SELECT desired_exercises FROM physical_setup LIMIT 1");
    const desired_exercises = setup ? setup.desired_exercises : '';

    const config = await database.get("SELECT * FROM ai_config LIMIT 1");
    const dbApiKey = config.apiKey || config.apikey;
    if (!config || (!dbApiKey && config.provider !== 'ollama')) {
      return res.status(400).json({ error: "Configuração de IA incompleta. Por favor, adicione sua Chave de API nas Configurações." });
    }
    config.apiKey = decryptKey(dbApiKey);

    const systemPrompt = `Você é um Personal Trainer IA especializado em calistenia, musculação, corrida e condicionamento físico.
Sua missão é criar um plano de treino semanal/rotina detalhado e estruturado para o usuário, com foco em desenvolvimento e saúde física (Esfera Físico).
Você deve utilizar a lista de exercícios desejados informada pelo usuário. Se estiver vazia ou for muito genérica, sugira um plano equilibrado de corpo inteiro (full-body/calistenia).

Regras de Negócio:
1. Organize o plano em treinos lógicos (ex: Treino A, Treino B, Corrida, etc.).
2. Para cada treino, defina séries (como inteiro), repetições (como texto), meta de execuções ("targetExecutions" como inteiro), quantidade concluída ("doneExecutions" como inteiro iniciando em 0) e notas de execução para os exercícios.
3. Adicione recomendações gerais (descanso, hidratação, aquecimento).
4. O resultado deve ser retornado EXCLUSIVAMENTE em formato JSON estruturado, sem explicações em texto.

Formato JSON esperado:
{
  "generalNotes": "Instruções gerais sobre aquecimento, descanso de 60s a 90s entre séries, beber água e consistência.",
  "workouts": [
    {
      "title": "Treino A - Membros Superiores (Empurrar e Puxar)",
      "description": "Foco em fortalecer peito, costas, ombros e braços",
      "exercises": [
        {
          "name": "Flexões de braço",
          "sets": 3,
          "reps": "10 a 15",
          "targetExecutions": 10,
          "doneExecutions": 0,
          "notes": "Mantenha o corpo alinhado e contraia o abdômen."
        },
        {
          "name": "Barra fixa (ou puxada alta)",
          "sets": 3,
          "reps": "6 a 10",
          "targetExecutions": 8,
          "doneExecutions": 0,
          "notes": "Controle a descida."
        }
      ]
    },
    {
      "title": "Treino B - Membros Inferiores e Core",
      "description": "Foco em pernas, glúteos e abdômen",
      "exercises": [
        {
          "name": "Agachamento livre",
          "sets": 4,
          "reps": "15 a 20",
          "targetExecutions": 15,
          "doneExecutions": 0,
          "notes": "Desça até os joelhos formarem 90 graus ou mais."
        }
      ]
    }
  ]
}`;

    const userPrompt = `Aqui está a lista de exercícios desejados pelo usuário:
"${desired_exercises || 'Nenhum exercício específico informado. Crie um plano de calistenia/corpo inteiro equilibrado para iniciante.'}"`;

    const rawResponse = await callLLM(config, systemPrompt, userPrompt);
    
    let cleanJsonStr = rawResponse.trim();
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const result = JSON.parse(cleanJsonStr);
    const sanitizedPlan = sanitizePhysicalPlan(result);
    
    const updateRes = await database.run("UPDATE physical_setup SET ai_plan = ?", [JSON.stringify(sanitizedPlan)]);
    if (updateRes.changes === 0) {
      await database.run("INSERT INTO physical_setup (desired_exercises, ai_plan) VALUES ('', ?)", [JSON.stringify(sanitizedPlan)]);
    }

    res.json({ success: true, plan: sanitizedPlan });
  } catch (error) {
    console.error("AI Physical Plan Generation failed:", error);
    res.status(500).json({ error: `Falha ao gerar plano de treino via IA: ${error.message}` });
  }
});

export default router;
