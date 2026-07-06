/**
 * Serviço de Integração com Inteligência Artificial
 * 
 * Responsável por:
 * - Padronizar a comunicação com provedores locais e em nuvem (Ollama, OpenAI, Gemini, Anthropic)
 * - Orquestrar prompts de sistema (Engenharia de Prompt) para geração de rotinas e treinos
 * - Limpar respostas JSON mal formatadas retornadas pelos modelos
 */

/**
 * Realiza chamadas padronizadas para diferentes provedores de IA.
 * Trata autenticação, configuração de URLs locais/remotas e estrutura o payload de cada modelo.
 */
export async function callLLM(config, systemPrompt, userPrompt) {
  const { provider, apiKey, model, endpoint } = config;

  if (provider === 'openai' || provider === 'ollama') {
    const url = provider === 'openai' 
      ? 'https://api.openai.com/v1/chat/completions' 
      : `${endpoint || 'http://localhost:11434'}/v1/chat/completions`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || (provider === 'openai' ? 'gpt-4o-mini' : 'llama3'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } 
  
  else if (provider === 'gemini') {
    const targetModel = model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser instructions:\n${userPrompt}` }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error("Invalid Gemini response format");
  } 
  
  else if (provider === 'anthropic') {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20240620',
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.content[0].text;
  } 
  
  else {
    throw new Error("Unsupported AI provider");
  }
}

/**
 * Sanitiza a resposta bruta da IA removendo blocos de markdown (```json).
 * Garante que a saída possa ser processada nativamente pelo JSON.parse().
 */
export function cleanJsonBlock(rawResponse) {
  let cleanJsonStr = rawResponse.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```/, '').replace(/```$/, '').trim();
  }
  return cleanJsonStr;
}

/**
 * Aciona o assistente "LevelUp Routine AI".
 * Injeta o contexto diário do usuário, metas ativas e rotina fixa para gerar um 
 * cronograma reorganizado e inteligente, priorizando "tarefas intercaladas".
 */
export async function generateSchedule(config, date, currentTasks, activeGoals, physicalSetup, note) {
  const systemPrompt = `Você é o LevelUp Routine AI, um assistente inteligente especializado em produtividade, organização de tempo e gamificação de rotina.
Sua missão é reorganizar o cronograma diário do usuário para encaixar suas metas de desenvolvimento pessoal, profissional, educacional, físico, financeiro e social.

Conceito Importante: TAREFAS RECORRENTES COMO BASE E RESPEITO AOS BLOCOS FIXOS
O usuário já possui um cronograma atual do dia (com blocos fixos importantes, como trabalho de 8h, sono, almoço). Você DEVE preservar essas tarefas longas e fixas!
O seu trabalho é usar as "Metas Recorrentes" para preencher os espaços vazios do dia ou intercalá-las dentro dos blocos longos de baixa demanda. Nunca exclua as tarefas longas (como CLT/Trabalho de 8h) do cronograma atual.

Conceito Importante: TAREFAS INTERCALADAS (Paralelas)
O usuário possui blocos longos em sua rotina (como "Trabalho CLT"). Muitas vezes, esses blocos longos possuem períodos de baixa demanda.
Sua tarefa é identificar esses blocos e "intercalar" metas recorrentes (como ler um livro, ver uma videoaula) DENTRO desse período se houver encaixe.
A tarefa intercalada DEVE possuir o campo "parentId" igual ao ID da tarefa pai e o horário deve estar totalmente contido no intervalo da tarefa pai.

Adições Solicitadas (Observações):
Se o usuário solicitar uma adição ao dia nas observações:
- Se for uma atividade pontual (ex: "hoje preciso ir ao médico às 14h"), remaneje o cronograma para acomodar essa nova atividade.
- Se a solicitação for um hábito novo que o usuário quer levar pra vida ou repetir com frequência (ex: "quero começar a meditar 15 min todo dia", "adicione corrida 3x na semana"), adicione esta nova meta no array 'newRecurringGoals' do JSON. Assim, o sistema vai ativá-la permanentemente para o usuário.

Regras Gerais:
1. Preserve o escopo geral do dia. Não exclua tarefas padrão a menos que o usuário solicite explicitamente.
2. Você pode ajustar levemente os horários (adiantar/atrasar) para acomodar novas metas.
3. Calcule o XP (10 XP/h para Pessoal/Social, 15 XP/h para o resto. Mínimo de 5 XP).
4. O resultado deve ser retornado EXCLUSIVAMENTE em formato JSON estruturado, sem explicações em texto.

Formato JSON esperado:
{
  "schedule": [
    {
      "id": "string única, ex: task-AI-1",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "duration": "ex: 1h ou 30m",
      "title": "Título da tarefa",
      "sphere": "Profissional | Educacional | Pessoal | Físico | Financeiro | Social",
      "xp": 15,
      "completed": false,
      "description": "",
      "parentId": "id_da_tarefa_pai_se_for_intercalada_ou_null"
    }
  ],
  "newRecurringGoals": [
    {
      "title": "Hábito novo sugerido",
      "durationMins": 15,
      "sphere": "Pessoal",
      "frequency": "0,1,2,3,4,5,6" // dias da semana separados por vírgula. 0=Dom, 1=Seg... 6=Sab
    }
  ]
}`;

  const userPrompt = `Data de hoje: ${date}
Cronograma atual do dia:
${JSON.stringify(currentTasks.map(t => ({ id: t.id, startTime: t.startTime, endTime: t.endTime, title: t.title, sphere: t.sphere, xp: t.xp, completed: t.completed })), null, 2)}

Metas recorrentes que o usuário gostaria de realizar:
${JSON.stringify(activeGoals.map(g => ({ id: g.id, title: g.title, durationMins: g.durationMins, sphere: g.sphere, frequency: g.frequency })), null, 2)}

Preferências de Exercícios Físicos (Esfera Físico):
Exercícios desejados: ${physicalSetup?.desired_exercises || 'Nenhum especificado'}
Plano de treino físico ativo gerado: ${physicalSetup?.ai_plan || 'Nenhum ativo'}

Observações/Instruções do usuário para hoje:
"${note || 'Nenhuma observação extra. Organize o dia da melhor forma possível, intercalando metas de estudos ou pessoal se houver espaço no trabalho ou horários livres.'}"`;

  const raw = await callLLM(config, systemPrompt, userPrompt);
  console.log("=== AI RAW RESPONSE (Schedule) ===");
  console.log(raw);
  const clean = cleanJsonBlock(raw);
  return JSON.parse(clean);
}

/**
 * Aciona o assistente "Personal Trainer IA".
 * Avalia os exercícios desejados e retorna um treino estruturado de 
 * corpo inteiro com rotinas, séries, repetições e descrições técnicas.
 */
export async function generateWorkoutPlan(config, desiredExercises) {
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
        }
      ]
    }
  ]
}`;

  const userPrompt = `Aqui está a lista de exercícios desejados pelo usuário:
"${desiredExercises || 'Nenhum exercício específico informado. Crie um plano de calistenia/corpo inteiro equilibrado para iniciante.'}"`;

  const raw = await callLLM(config, systemPrompt, userPrompt);
  const clean = cleanJsonBlock(raw);
  return JSON.parse(clean);
}

/**
 * Aciona o assistente "Mestre de Orçamentos RPG".
 * Cria uma planilha orçamentária sugerida com base na renda e meta de economia,
 * transformando esses alvos financeiros em "Missões (Quests)" mensais de RPG.
 */
export async function generateFinancialPlan(config, financialGoals, monthlyIncome, savingsTargetPercent) {
  const systemPrompt = `Você é um Mestre de Orçamentos RPG e Assessor Financeiro IA gamificado.
Sua missão é criar um plano de orçamento gamificado e 4 quests financeiras mensais para a Esfera Financeira do usuário.
Você deve considerar a Renda Mensal (monthly_income: R$ ${monthlyIncome}), a Meta de Economia (savings_target_percent: ${savingsTargetPercent}%) e as Metas Financeiras descritas pelo usuário.

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
4. O resultado deve ser retornado EXCLUSIVAMENTE em formato JSON estruturado, sem explicações em texto.

Formato JSON esperado:
{
  "generalNotes": "Dicas rápidas estilo conselhos de taverna do jogo sobre investimentos e controle de gastos baseado nas metas do usuário.",
  "suggestedBudgets": [
    { "category": "Aporte / Poupança", "limit": 600, "percent": 20 },
    { "category": "Contas / Essenciais", "limit": 1500, "percent": 50 }
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
    }
  ]
}`;

  const userPrompt = `Aqui estão as preferências e objetivos financeiros do usuário:
Renda Mensal: R$ ${monthlyIncome}
Meta de Economia: ${savingsTargetPercent}%
Objetivos declarados pelo usuário: "${financialGoals || 'Nenhum objetivo específico informado. Crie um plano básico de sobrevivência financeira.'}"`;

  const raw = await callLLM(config, systemPrompt, userPrompt);
  const clean = cleanJsonBlock(raw);
  return JSON.parse(clean);
}

/**
 * Aciona o assistente "LevelUp Book AI".
 * Calcula dinamicamente uma quantidade justa de XP de recompensa
 * com base na densidade técnica, profundidade e tamanho do livro lido.
 */
export async function calculateBookXp(config, title, author, sphere, pages, goal, depth) {
  const systemPrompt = `Você é o LevelUp Book AI, um módulo especializado em gamificação de hábitos de leitura.
Sua tarefa é calcular o XP ideal para a conclusão de um livro com base nos detalhes informados pelo usuário.

Regras de XP:
1. Livros da esfera "Educacional" (didáticos/técnicos):
   - Avalie o tema e a profundidade/grau técnico.
   - Livros de alta complexidade técnica (ex: engenharia, cálculo avançado, programação complexa) ganham mais XP.
   - A recompensa de XP deve variar de 50 a 300 XP dependendo da complexidade técnica.
2. Livros da esfera "Pessoal" (assuntos diversos):
   - Avalie o tamanho (número de páginas) e o objetivo central (crescimento pessoal, ficção, hábitos, etc.).
   - A recompensa de XP deve variar de 30 a 200 XP com base no volume de páginas e relevância do objetivo.
3. O resultado deve ser retornado EXCLUSIVAMENTE em formato JSON estruturado, sem explicações em texto.

Formato JSON esperado:
{
  "xp": 120,
  "reasoning": "Breve justificativa em português sobre o cálculo do XP (ex: Livro técnico denso com 400 páginas = 150 XP)."
}`;

  const userPrompt = `Detalhes do livro:
Título: ${title}
Autor: ${author || 'Não informado'}
Esfera: ${sphere}
Páginas/Tamanho: ${pages || 'Não informado'}
Objetivo central/Tema: ${goal || 'Não informado'}
Profundidade/Grau Técnico: ${depth || 'Não informado'}`;

  const raw = await callLLM(config, systemPrompt, userPrompt);
  const clean = cleanJsonBlock(raw);
  return JSON.parse(clean);
}
