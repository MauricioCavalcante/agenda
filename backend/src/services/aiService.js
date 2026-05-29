// AI Service for interacting with LLM providers (OpenAI, Google Gemini, Anthropic, Ollama)

export async function callLLM(config, systemPrompt, userPrompt) {
  const { provider, apiKey, model, apiEndpoint } = config;

  if (provider === 'openai' || provider === 'ollama') {
    const url = provider === 'openai' 
      ? 'https://api.openai.com/v1/chat/completions' 
      : `${apiEndpoint || 'http://localhost:11434'}/v1/chat/completions`;
    
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

export function cleanJsonBlock(rawResponse) {
  let cleanJsonStr = rawResponse.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```/, '').replace(/```$/, '').trim();
  }
  return cleanJsonStr;
}

export async function generateSchedule(config, date, currentTasks, activeGoals, physicalSetup, note) {
  const systemPrompt = `Você é o LevelUp Routine AI, um assistente inteligente especializado em produtividade, organização de tempo e gamificação de rotina.
Sua missão é reorganizar o cronograma diário do usuário para encaixar suas metas de desenvolvimento pessoal, profissional, educacional, físico, financeiro e social.

Conceito Importante: TAREFAS INTERCALADAS (Paralelas)
O usuário possui blocos longos em sua rotina (como "Trabalho CLT"). Muitas vezes, esses blocos longos possuem períodos de baixa demanda.
Sua tarefa é identificar esses blocos e, se adequado (ou se o usuário pedir nas observações), "intercalar" metas recorrentes (como ler um livro, ver uma videoaula, fazer um curso rápido) DENTRO desse período.
Regras para tarefas intercaladas:
1. Uma tarefa intercalada deve ser inserida na lista de tarefas retornada.
2. Ela DEVE possuir o campo "parentId" igual ao ID da tarefa pai na qual ela ocorre (ex: o ID da tarefa CLT).
3. O horário de início e fim da tarefa intercalada (startTime e endTime) DEVE estar totalmente contido no intervalo de tempo da tarefa pai.
4. Ela possui sua própria esfera (ex: Educacional para ver aulas) e seu próprio XP.

Regras Gerais:
1. Preserve o escopo geral do dia. Não exclua tarefas padrão importantes (como CLT, Almoço e Estudos padrão) a menos que o usuário solicite explicitamente nas observações.
2. Você pode ajustar levemente os horários de início e fim das tarefas padrão (como adiantar ou atrasar em 30m ou 1h) para acomodar novas metas, se necessário.
3. Se houver metas recorrentes do usuário, tente encaixá-las respeitando a duração solicitada.
4. Calcule o XP para cada tarefa gerada/metas (10 XP por hora para Pessoal/Social, 15 XP por hora para Profissional/Educacional/Físico/Financeiro. Tarefas curtas de 30 minutos ganham metade do XP, mínimo 5 XP, exceto refeições/descanso que ganham 0 XP).
5. Se o dia de hoje incluir blocos da esfera "Físico" (Exercícios Físicos), tente customizar o título e a descrição dessa tarefa utilizando a lista de exercícios desejados e o plano de treino físico ativo do usuário fornecidos no prompt (ex: "Exercícios Físicos: Treino A (Superior)" ou similar, em vez de apenas "Exercícios Físicos").
6. O resultado deve ser retornado EXCLUSIVAMENTE em formato JSON estruturado, sem explicações em texto.

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
      "parentId": "id_da_tarefa_pai_se_for_intercalada_ou_null_se_for_normal"
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
  const clean = cleanJsonBlock(raw);
  return JSON.parse(clean);
}

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
