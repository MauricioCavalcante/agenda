/**
 * Contexto Global (State Management)
 */
import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const AppContext = createContext();

const API_BASE = '/api';

// Intercepta todas as chamadas 'fetch' neste arquivo para injetar o JWT
const _originalFetch = window.fetch;
const fetch = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { ...options.headers };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const response = await _originalFetch(url, { ...options, headers });
  if (response.status === 401) {
    await supabase.auth.signOut();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
};

export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AppProvider({ children }) {
  // Global States
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [navOpen, setNavOpen] = useState(false);
  const [date, setDate] = useState(getTodayString());
  const [schedule, setSchedule] = useState([]);
  const scheduleRef = useRef([]);
  const setScheduleWithRef = (value) => {
    const resolved = typeof value === 'function' ? value(scheduleRef.current) : value;
    scheduleRef.current = resolved;
    setSchedule(resolved);
  };
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // AI Config States
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [isSavingAiConfig, setIsSavingAiConfig] = useState(false);
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiEndpoint, setAiEndpoint] = useState('https://api.openai.com/v1');

  // Auth State
  const [session, setSession] = useState(null);

  // Database State
  const [dbProvider, setDbProvider] = useState('sqlite');
  const [dbConnectionString, setDbConnectionString] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState(5432);
  const [dbDatabase, setDbDatabase] = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbSsl, setDbSsl] = useState(true);
  const [dbActive, setDbActive] = useState(false);
  const [testingDbConnection, setTestingDbConnection] = useState(false);
  const [activatingDb, setActivatingDb] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Goals States
  const [goals, setGoals] = useState([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDuration, setGoalDuration] = useState(30);
  const [goalSphere, setGoalSphere] = useState('Profissional');
  const [goalFreq, setGoalFreq] = useState('0,1,2,3,4,5,6');
  const [editingGoal, setEditingGoal] = useState(null);

  // AI Prompt State
  const [aiPromptNote, setAiPromptNote] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Calendar View States
  const [calendarXp, setCalendarXp] = useState({});
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-indexed

  // Physical Setup States
  const [physicalSetup, setPhysicalSetup] = useState({ desired_exercises: '', ai_plan: '' });
  const [desiredExercisesInput, setDesiredExercisesInput] = useState('');
  const [aiPlanJson, setAiPlanJson] = useState(null);
  const [generatingPhysicalPlan, setGeneratingPhysicalPlan] = useState(false);
  const [savingPhysicalSetup, setSavingPhysicalSetup] = useState(false);
  const [editingPhysicalPlanText, setEditingPhysicalPlanText] = useState(false);
  const [physicalPlanText, setPhysicalPlanText] = useState('');

  // Financial Setup States
  const [financialSetup, setFinancialSetup] = useState({ financial_goals: '', monthly_income: 0, savings_target_percent: 20, ai_plan: '' });
  const [financialGoalsInput, setFinancialGoalsInput] = useState('');
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState(0);
  const [savingsTargetInput, setSavingsTargetInput] = useState(20);
  const [finPlanJson, setFinPlanJson] = useState(null);
  const [generatingFinPlan, setGeneratingFinPlan] = useState(false);
  const [savingFinSetup, setSavingFinSetup] = useState(false);
  const [editingFinPlanText, setEditingFinPlanText] = useState(false);
  const [finPlanText, setFinPlanText] = useState('');

  // Book Library States
  const [books, setBooks] = useState([]);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookSphere, setBookSphere] = useState('Pessoal');
  const [bookPages, setBookPages] = useState('');
  const [bookGoal, setBookGoal] = useState('');
  const [bookDepth, setBookDepth] = useState('Iniciante');
  const [bookFilter, setBookFilter] = useState('interesse');
  const [addingBook, setAddingBook] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Timeline / Meeting / Fixed Task Form States
  const [actionTab, setActionTab] = useState('meeting'); // 'meeting' | 'fixed'
  const [meetTitle, setMeetTitle] = useState('');
  const [meetStart, setMeetStart] = useState('14:00');
  const [meetEnd, setMeetEnd] = useState('15:00');
  const [meetSphere, setMeetSphere] = useState('Profissional');
  const [meetParentId, setMeetParentId] = useState(null);
  const [meetIsMeeting, setMeetIsMeeting] = useState(false);
  const [meetShift, setMeetShift] = useState(true);

  // Edit task Form States
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editSphere, setEditSphere] = useState('Profissional');
  const [editXp, setEditXp] = useState(10);
  const [editDesc, setEditDesc] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [editParentId, setEditParentId] = useState(null);
  const [editIsMeeting, setEditIsMeeting] = useState(false);

  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Complete task Form States
  const [completionTask, setCompletionTask] = useState(null);
  const [completionDesc, setCompletionDesc] = useState('');

  // Apply Theme Effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Request browser notifications on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const triggerBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>'
      });
    }
  };

  // -------------------------------------------------------------
  // Data Fetching Functions
  // -------------------------------------------------------------
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchSchedule = async (targetDate, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schedule?date=${targetDate}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setScheduleWithRef(data);
      } else {
        console.error("fetchSchedule: expected array, got", data);
        if (!silent) setScheduleWithRef([]);
      }
    } catch (e) {
      console.error("Error fetching schedule:", e);
      if (!silent) setScheduleWithRef([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
      setHistory([]);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/user-goals`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoals(data);
      } else {
        setGoals([]);
      }
    } catch (e) {
      console.error("Error fetching goals:", e);
      setGoals([]);
    }
  };

  const fetchAiConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/ai-config`);
      const data = await res.json();
      setAiProvider(data.provider || 'openai');
      setAiModel(data.model || 'gpt-4o-mini');
      setAiEndpoint(data.apiEndpoint || 'https://api.openai.com/v1');
      setAiApiKey(data.apiKey || '');
    } catch (e) {
      console.error("Error fetching AI config:", e);
    }
  };

  const fetchDbConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/db-config`);
      const data = await res.json();
      setDbProvider(data.provider || 'sqlite');
      setDbConnectionString(data.connection_string || '');
      setDbHost(data.host || '');
      setDbPort(data.port || 5432);
      setDbDatabase(data.database || '');
      setDbUsername(data.username || '');
      setDbPassword(data.password || '');
      setDbSsl(data.ssl !== false);
      setDbActive(!!data.active);
    } catch (e) {
      console.error("Error fetching DB config:", e);
    }
  };

  const fetchCalendarXp = async () => {
    try {
      const res = await fetch(`${API_BASE}/calendar-xp`);
      const data = await res.json();
      setCalendarXp(data);
    } catch (e) {
      console.error("Error fetching calendar XP:", e);
    }
  };

  const fetchPhysicalSetup = async () => {
    try {
      const res = await fetch(`${API_BASE}/physical-setup`);
      const data = await res.json();
      setPhysicalSetup(data);
      setDesiredExercisesInput(data.desired_exercises || '');
      if (data.ai_plan) {
        try {
          const parsed = typeof data.ai_plan === 'string' ? JSON.parse(data.ai_plan) : data.ai_plan;
          setAiPlanJson(parsed);
          setPhysicalPlanText(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.error("Error parsing ai_plan JSON:", e);
        }
      } else {
        setAiPlanJson(null);
        setPhysicalPlanText('');
      }
    } catch (e) {
      console.error("Error fetching physical setup:", e);
    }
  };

  const handleSaveDesiredExercises = async () => {
    setSavingPhysicalSetup(true);
    try {
      const res = await fetch(`${API_BASE}/physical-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desired_exercises: desiredExercisesInput })
      });
      if (res.ok) {
        showToast("Exercícios desejados salvos!");
        fetchPhysicalSetup();
      } else {
        alert("Falha ao salvar exercícios desejados.");
      }
    } catch (e) {
      console.error("Error saving physical setup:", e);
      alert("Erro de conexão ao salvar exercícios.");
    } finally {
      setSavingPhysicalSetup(false);
    }
  };

  const handleGeneratePhysicalPlan = async () => {
    setGeneratingPhysicalPlan(true);
    try {
      // Save current input first
      await fetch(`${API_BASE}/physical-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desired_exercises: desiredExercisesInput })
      });
      
      const res = await fetch(`${API_BASE}/physical-setup/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Falha ao gerar plano via IA.");
        return;
      }
      const data = await res.json();
      if (data.success && data.plan) {
        setAiPlanJson(data.plan);
        setPhysicalPlanText(JSON.stringify(data.plan, null, 2));
        showToast("Plano de treino criado pela IA!");
        fetchPhysicalSetup();
      }
    } catch (e) {
      console.error("Error generating physical plan:", e);
      alert("Erro ao conectar à IA para gerar o plano.");
    } finally {
      setGeneratingPhysicalPlan(false);
    }
  };

  const handleSavePhysicalPlanText = async () => {
    try {
      let parsed;
      try {
        parsed = JSON.parse(physicalPlanText);
      } catch (err) {
        alert("Erro de sintaxe no JSON. Por favor, verifique a formatação do plano.");
        return;
      }
      
      const res = await fetch(`${API_BASE}/physical-setup/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: parsed })
      });
      
      if (res.ok) {
        setAiPlanJson(parsed);
        setEditingPhysicalPlanText(false);
        showToast("Plano de treino atualizado com sucesso!");
        fetchPhysicalSetup();
      } else {
        alert("Falha ao salvar plano de treino.");
      }
    } catch (e) {
      console.error("Error saving physical plan text:", e);
      alert("Erro de conexão ao salvar plano de treino.");
    }
  };

  const handleUpdateExerciseExecution = async (wIdx, exIdx, field, value) => {
    if (!aiPlanJson || !aiPlanJson.workouts) return;

    const updatedPlan = JSON.parse(JSON.stringify(aiPlanJson));
    const workout = updatedPlan.workouts[wIdx];
    if (!workout || !workout.exercises) return;
    const exercise = workout.exercises[exIdx];
    if (!exercise) return;

    if (field === 'doneExecutions') {
      const targetVal = parseInt(exercise.targetExecutions, 10) || 10;
      exercise.doneExecutions = Math.max(0, Math.min(targetVal, value));
    } else if (field === 'targetExecutions') {
      const newTarget = Math.max(1, value);
      exercise.targetExecutions = newTarget;
      if (exercise.doneExecutions > newTarget) {
        exercise.doneExecutions = newTarget;
      }
    }

    setAiPlanJson(updatedPlan);
    setPhysicalPlanText(JSON.stringify(updatedPlan, null, 2));

    try {
      const res = await fetch(`${API_BASE}/physical-setup/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: updatedPlan })
      });
      if (!res.ok) {
        console.error("Failed to autosave physical plan executions.");
      }
    } catch (e) {
      console.error("Error autosaving physical plan executions:", e);
    }
  };

  const fetchFinancialSetup = async () => {
    try {
      const res = await fetch(`${API_BASE}/financial-setup`);
      const data = await res.json();
      setFinancialSetup(data);
      setFinancialGoalsInput(data.financial_goals || '');
      setMonthlyIncomeInput(parseFloat(data.monthly_income) || 0);
      setSavingsTargetInput(parseFloat(data.savings_target_percent) || 20);
      if (data.ai_plan) {
        try {
          const parsed = typeof data.ai_plan === 'string' ? JSON.parse(data.ai_plan) : data.ai_plan;
          setFinPlanJson(parsed);
          setFinPlanText(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.error("Error parsing financial ai_plan JSON:", e);
        }
      } else {
        setFinPlanJson(null);
        setFinPlanText('');
      }
    } catch (e) {
      console.error("Error fetching financial setup:", e);
    }
  };

  const handleSaveFinancialSetup = async () => {
    setSavingFinSetup(true);
    try {
      const res = await fetch(`${API_BASE}/financial-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          financial_goals: financialGoalsInput,
          monthly_income: parseFloat(monthlyIncomeInput) || 0,
          savings_target_percent: parseFloat(savingsTargetInput) || 20
        })
      });
      if (res.ok) {
        showToast("Dados financeiros salvos!");
        fetchFinancialSetup();
      }
    } catch (e) {
      console.error("Error saving financial setup:", e);
      alert("Erro ao conectar ao servidor para salvar.");
    } finally {
      setSavingFinSetup(false);
    }
  };

  const handleGenerateFinancialPlan = async () => {
    setGeneratingFinPlan(true);
    try {
      await fetch(`${API_BASE}/financial-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          financial_goals: financialGoalsInput,
          monthly_income: parseFloat(monthlyIncomeInput) || 0,
          savings_target_percent: parseFloat(savingsTargetInput) || 20
        })
      });

      const res = await fetch(`${API_BASE}/financial-setup/generate-plan`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setFinPlanJson(data.plan);
        setFinPlanText(JSON.stringify(data.plan, null, 2));
        showToast("Orçamento RPG criado pela IA!");
        fetchFinancialSetup();
      }
    } catch (e) {
      console.error("Error generating financial plan:", e);
      alert("Erro ao conectar à IA para gerar o orçamento.");
    } finally {
      setGeneratingFinPlan(false);
    }
  };

  const handleSaveFinPlanText = async () => {
    try {
      let parsed;
      try {
        parsed = JSON.parse(finPlanText);
      } catch (err) {
        alert("Erro de sintaxe no JSON. Por favor, verifique a formatação do plano.");
        return;
      }
      
      const res = await fetch(`${API_BASE}/financial-setup/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: parsed })
      });
      
      if (res.ok) {
        setFinPlanJson(parsed);
        setEditingFinPlanText(false);
        showToast("Plano de orçamento atualizado!");
        fetchFinancialSetup();
      } else {
        alert("Falha ao salvar plano de orçamento.");
      }
    } catch (e) {
      console.error("Error saving financial plan text:", e);
      alert("Erro de conexão ao salvar plano de orçamento.");
    }
  };

  const handleUpdateQuestValue = async (qIdx, field, value) => {
    if (!finPlanJson || !finPlanJson.quests) return;

    const updatedPlan = JSON.parse(JSON.stringify(finPlanJson));
    const quest = updatedPlan.quests[qIdx];
    if (!quest) return;

    if (field === 'currentValue') {
      quest.currentValue = Math.max(0, value);
    }

    setFinPlanJson(updatedPlan);
    setFinPlanText(JSON.stringify(updatedPlan, null, 2));

    try {
      const res = await fetch(`${API_BASE}/financial-setup/save-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: updatedPlan })
      });
      if (!res.ok) {
        console.error("Failed to autosave financial quest execution.");
      }
    } catch (e) {
      console.error("Error autosaving financial quest execution:", e);
    }
  };

  const handleClaimQuestXp = async (questId, questTitle, xp) => {
    try {
      const res = await fetch(`${API_BASE}/financial-setup/claim-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId, questTitle, xp })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        showToast(`Quest Concluída! +${xp} XP de Financeiro obtido!`);
        fetchFinancialSetup();
        fetchStats();
        fetchHistory();
        fetchCalendarXp();
      }
    } catch (e) {
      console.error("Error claiming quest XP:", e);
      alert("Erro ao conectar ao servidor para resgatar XP.");
    }
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch(`${API_BASE}/books`);
      const data = await res.json();
      setBooks(data);
    } catch (e) {
      console.error("Error fetching books:", e);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleAddBook = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!bookTitle) return;
    setAddingBook(true);
    try {
      const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          sphere: bookSphere,
          pages: bookSphere === 'Pessoal' && bookPages ? Number(bookPages) : null,
          goal: bookGoal,
          depth: bookSphere === 'Educacional' ? bookDepth : ''
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Erro ao cadastrar livro");
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast(`Livro cadastrado com sucesso! Recompensa: +${data.book.xp} XP.`);
        setBookTitle('');
        setBookAuthor('');
        setBookPages('');
        setBookGoal('');
        setBookDepth('Iniciante');
        fetchBooks();
      }
    } catch (e) {
      console.error("Error adding book:", e);
      alert("Erro ao conectar ao servidor para adicionar livro.");
    } finally {
      setAddingBook(false);
    }
  };

  const handleToggleBook = async (id, currentCompleted) => {
    try {
      const newStatus = !currentCompleted;
      const res = await fetch(`${API_BASE}/books/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: newStatus })
      });
      if (!res.ok) {
        alert("Erro ao alterar estado do livro.");
        return;
      }
      const data = await res.json();
      if (data.success) {
        if (newStatus) {
          showToast(`Livro lido! Nível atualizado.`);
        } else {
          showToast("Livro marcado como de interesse. XP removido.");
        }
        fetchBooks();
        fetchStats();
        fetchHistory();
        fetchCalendarXp();
        fetchSchedule(date, true);
      }
    } catch (e) {
      console.error("Error toggling book:", e);
      alert("Erro de conexão ao alterar estado do livro.");
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Deseja realmente remover este livro da sua biblioteca? Isso anulará qualquer XP associado.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/books/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Livro removido da biblioteca.");
        fetchBooks();
        fetchStats();
        fetchHistory();
        fetchCalendarXp();
        fetchSchedule(date, true);
      } else {
        alert("Falha ao remover o livro.");
      }
    } catch (e) {
      console.error("Error deleting book:", e);
      alert("Erro de conexão ao remover livro.");
    }
  };

  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteTask = async () => {
    if (!completionTask) return;
    const taskSnapshot = completionTask;
    const descSnapshot = completionDesc;

    setIsCompleting(true);
    try {
      const res = await fetch(`${API_BASE}/schedule/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          taskId: taskSnapshot.id,
          description: descSnapshot || "Atividade concluída."
        })
      });
      
      if (!res.ok) {
        throw new Error("Erro de resposta do servidor");
      }
      
      const data = await res.json();
      if (data.success) {
        const oldLevel = stats?.spheres?.[taskSnapshot.sphere]?.level;
        const newLevel = data.stats?.spheres?.[taskSnapshot.sphere]?.level;

        if (newLevel > oldLevel) {
          triggerBrowserNotification(
            `🎉 LEVEL UP! ${taskSnapshot.sphere}`,
            `Parabéns! Sua esfera ${taskSnapshot.sphere} subiu para o nível ${newLevel} (${data.stats?.spheres?.[taskSnapshot.sphere]?.title || ''})!`
          );
          showToast(`Level Up na esfera ${taskSnapshot.sphere}! Nível ${newLevel}!`);
        } else {
          showToast(`Tarefa concluída! +${taskSnapshot.xp} XP em ${taskSnapshot.sphere}`);
        }

        if (Array.isArray(data.schedule)) {
          setScheduleWithRef(data.schedule);
        } else {
          fetchSchedule(date, true);
        }
        if (data.stats) setStats(data.stats);
        fetchHistory();
        fetchCalendarXp();
        
        // Close modal only on success
        setCompletionTask(null);
        setCompletionDesc('');
      } else {
        showToast("Erro ao concluir tarefa. Tente novamente.");
      }
    } catch (e) {
      console.error("Error completing task:", e);
      showToast("Erro de rede ao concluir tarefa. Tente novamente.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!meetTitle) return;

    if (actionTab === 'meeting') {
      try {
        const res = await fetch(`${API_BASE}/schedule/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            startTime: meetStart,
            endTime: meetEnd,
            title: meetTitle,
            sphere: meetSphere
          })
        });
        const updatedSchedule = await res.json();
        if (Array.isArray(updatedSchedule)) {
          setScheduleWithRef(updatedSchedule);
        }
        setMeetTitle('');
        showToast("Agenda reorganizada! Horários subsequentes deslocados.");
        
        triggerBrowserNotification(
          "📅 Agenda Reorganizada",
          `A reunião "${meetTitle}" deslocou as tarefas subsequentes para o dia de hoje.`
        );
      } catch (e) {
        console.error("Error rescheduling:", e);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/schedule/add-task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            startTime: meetStart,
            endTime: meetEnd,
            title: meetTitle,
            sphere: meetSphere,
            parentId: meetParentId || null
          })
        });
        const updatedSchedule = await res.json();
        if (Array.isArray(updatedSchedule)) {
          setScheduleWithRef(updatedSchedule);
        }
        setMeetTitle('');
        setMeetParentId(null);
        showToast("Atividade fixa inserida com sucesso!");

        triggerBrowserNotification(
          "➕ Atividade Criada",
          `A tarefa "${meetTitle}" foi registrada na sua agenda de hoje.`
        );
      } catch (e) {
        console.error("Error adding fixed task:", e);
      }
    }
  };

  const handleEditTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingTask) return;
    const taskSnapshot = { ...editingTask };

    setIsSavingTask(true);
    try {
      const res = await fetch(`${API_BASE}/schedule/edit-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          taskId: taskSnapshot.id,
          title: editTitle,
          startTime: editStart,
          endTime: editEnd,
          sphere: editSphere,
          xp: Number(editXp),
          description: editDesc,
          completed: editCompleted,
          parentId: editParentId || null
        })
      });

      if (!res.ok) {
        throw new Error("Erro de resposta do servidor");
      }

      const data = await res.json();
      if (data.success) {
        showToast("Atividade atualizada com sucesso!");
        if (Array.isArray(data.schedule)) {
          setScheduleWithRef(data.schedule);
        } else {
          fetchSchedule(date, true);
        }
        if (data.stats) setStats(data.stats);
        fetchHistory();
        fetchCalendarXp();
        
        // Close modal on success
        setEditingTask(null);
      } else {
        showToast("Erro ao atualizar atividade. Tente novamente.");
      }
    } catch (e) {
      console.error("Error editing task:", e);
      showToast("Erro de rede ao atualizar atividade. Tente novamente.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Deseja realmente excluir esta atividade?")) return;

    setIsDeletingTask(true);
    try {
      const res = await fetch(`${API_BASE}/schedule/delete-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, taskId })
      });

      if (!res.ok) {
        throw new Error("Erro de resposta do servidor");
      }

      const data = await res.json();
      if (data.success) {
        showToast("Atividade excluída!");
        if (Array.isArray(data.schedule)) {
          setScheduleWithRef(data.schedule);
        } else {
          fetchSchedule(date, true);
        }
        if (data.stats) setStats(data.stats);
        fetchHistory();
        fetchCalendarXp();

        // Close modal on success
        setEditingTask(null);
      } else {
        showToast("Erro ao excluir atividade. Tente novamente.");
      }
    } catch (e) {
      console.error("Error deleting task:", e);
      showToast("Erro de rede ao excluir atividade. Tente novamente.");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleSaveAiConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingAiConfig(true);
    try {
      const res = await fetch(`${API_BASE}/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          model: aiModel,
          apiEndpoint: aiEndpoint
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Configurações de IA salvas!");
        fetchAiConfig();
      } else {
        showToast("Erro ao salvar: " + (data.error || "Tente novamente."));
      }
    } catch (e) {
      console.error("Error saving AI config:", e);
      showToast("Erro de conexão ao salvar configurações.");
    } finally {
      setIsSavingAiConfig(false);
    }
  };

  const handleTestDbConnection = async () => {
    setTestingDbConnection(true);
    try {
      const res = await fetch(`${API_BASE}/db-config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_string: dbConnectionString,
          host: dbHost,
          port: dbPort,
          database: dbDatabase,
          username: dbUsername,
          password: dbPassword,
          ssl: dbSsl
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Conexão de teste bem-sucedida!");
        return { success: true };
      } else {
        alert(data.error || "Falha na conexão de teste.");
        return { success: false };
      }
    } catch (e) {
      console.error("Error testing DB connection:", e);
      alert("Erro de conexão ao testar banco de dados.");
      return { success: false };
    } finally {
      setTestingDbConnection(false);
    }
  };

  const handleActivateDbConnection = async (migrateData) => {
    setActivatingDb(true);
    try {
      const res = await fetch(`${API_BASE}/db-config/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_string: dbConnectionString,
          host: dbHost,
          port: dbPort,
          database: dbDatabase,
          username: dbUsername,
          password: dbPassword,
          ssl: dbSsl,
          migrateData
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Banco de dados ativado com sucesso!");
        await fetchDbConfig();
        await fetchStats();
        await fetchSchedule(date);
        await fetchHistory();
        await fetchGoals();
        await fetchAiConfig();
        await fetchCalendarXp();
        await fetchPhysicalSetup();
        await fetchFinancialSetup();
        await fetchBooks();
        return { success: true };
      } else {
        alert(data.error || "Erro ao ativar banco de dados.");
        return { success: false };
      }
    } catch (e) {
      console.error("Error activating DB connection:", e);
      alert("Erro ao conectar à API de ativação de banco de dados.");
      return { success: false };
    } finally {
      setActivatingDb(false);
    }
  };

  const handleDeactivateDbConnection = async () => {
    setActivatingDb(true);
    try {
      const res = await fetch(`${API_BASE}/db-config/deactivate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Banco de dados desconectado! Retornando ao SQLite local.");
        await fetchDbConfig();
        await fetchStats();
        await fetchSchedule(date);
        await fetchHistory();
        await fetchGoals();
        await fetchAiConfig();
        await fetchCalendarXp();
        await fetchPhysicalSetup();
        await fetchFinancialSetup();
        await fetchBooks();
        return { success: true };
      } else {
        alert(data.error || "Erro ao desativar banco remoto.");
        return { success: false };
      }
    } catch (e) {
      console.error("Error deactivating DB connection:", e);
      alert("Erro ao desconectar banco de dados.");
      return { success: false };
    } finally {
      setActivatingDb(false);
    }
  };

  const handleAddGoal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!goalTitle) return;
    try {
      const res = await fetch(`${API_BASE}/user-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle,
          durationMins: goalDuration,
          sphere: goalSphere,
          frequency: goalFreq
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setGoals(data);
        setGoalTitle('');
        showToast("Meta recorrente cadastrada!");
      } else {
        showToast("Erro ao cadastrar meta: " + (data.error || "Tente novamente."));
      }
    } catch (e) {
      console.error("Error adding goal:", e);
      showToast("Erro de conexão ao cadastrar meta.");
    }
  };

  const handleUpdateGoal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingGoal || !goalTitle) return;
    try {
      const res = await fetch(`${API_BASE}/user-goals/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGoal.id,
          title: goalTitle,
          durationMins: goalDuration,
          sphere: goalSphere,
          frequency: goalFreq
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoals(data);
      }
      setEditingGoal(null);
      setGoalTitle('');
      setGoalDuration(30);
      setGoalSphere('Profissional');
      setGoalFreq('Todos os dias');
      showToast("Meta recorrente atualizada!");
    } catch (e) {
      console.error("Error updating goal:", e);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/user-goals/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoals(data);
      }
      showToast("Meta recorrente removida.");
    } catch (e) {
      console.error("Error deleting goal:", e);
    }
  };

  const handleGenerateAiSchedule = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/schedule/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          note: aiPromptNote
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Falha na geração via IA");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setScheduleWithRef(data);
        fetchStats();
        fetchHistory();
        fetchCalendarXp();
      }
      setAiPromptNote('');
      showToast("Rotina gerada e estruturada com IA!");
    } catch (e) {
      console.error("Error generating schedule:", e);
      alert("Erro ao conectar ao modelo de IA. Verifique as configurações e chaves de API.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Atenção: Isso redefinirá todo o seu histórico, XP e níveis de volta ao Nível 1. Deseja continuar?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/stats/reset`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast("Dados reiniciados com sucesso!");
        fetchStats();
        fetchSchedule(date);
        fetchHistory();
        fetchCalendarXp();
      }
    } catch (e) {
      console.error("Error resetting stats:", e);
    }
  };

  // Helpers
  const changeDate = (days) => {
    const current = new Date(date + 'T00:00:00');
    current.setDate(current.getDate() + days);
    
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    
    setDate(`${year}-${month}-${day}`);
  };

  const changeCalendarMonth = (offset) => {
    let newMonth = calMonth + offset;
    let newYear = calYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const getDaysInMonthGrid = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, etc.
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    const grid = [];
    
    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      grid.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    
    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      grid.push({ day: d, month: month, year: year, isCurrentMonth: true });
    }
    
    // Next month padding days to reach 42 cells (6 rows)
    const remainingCells = 42 - grid.length;
    for (let d = 1; d <= remainingCells; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      grid.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    
    return grid;
  };

  const formatDisplayDate = (dateStr) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getMonthName = (monthIdx) => {
    const names = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return names[monthIdx];
  };

  // -------------------------------------------------------------
  // Todo List States and Handlers
  // -------------------------------------------------------------
  const [todos, setTodos] = useState([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoLabel, setTodoLabel] = useState('');
  const [todoSphere, setTodoSphere] = useState('Profissional');
  const [todoXp, setTodoXp] = useState(10);
  const [todoDescription, setTodoDescription] = useState('');
  const [todoParentId, setTodoParentId] = useState('');
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);

  const fetchTodos = async () => {
    setLoadingTodos(true);
    try {
      const res = await fetch(`${API_BASE}/todos`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTodos(data);
      } else {
        setTodos([]);
      }
    } catch (e) {
      console.error("Error fetching todos:", e);
      setTodos([]);
    } finally {
      setLoadingTodos(false);
    }
  };

  const handleAddTodo = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!todoTitle || !todoLabel) return;
    setAddingTodo(true);
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: todoTitle,
          label: todoLabel,
          sphere: todoSphere,
          xp: Number(todoXp),
          parentId: todoParentId || null,
          description: todoDescription
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Erro ao cadastrar tarefa");
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast("Tarefa cadastrada com sucesso!");
        setTodoTitle('');
        setTodoLabel('');
        setTodoXp(10);
        setTodoDescription('');
        setTodoParentId('');
        if (Array.isArray(data.todos)) {
          setTodos(data.todos);
        } else {
          fetchTodos();
        }
      }
    } catch (e) {
      console.error("Error adding todo:", e);
      alert("Erro de conexão ao adicionar tarefa.");
    } finally {
      setAddingTodo(false);
    }
  };

  const handleCompleteTodo = async (todoId) => {
    try {
      const res = await fetch(`${API_BASE}/todos/toggle-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId })
      });
      if (!res.ok) {
        alert("Erro ao alternar conclusão da tarefa.");
        return;
      }
      const data = await res.json();
      if (data.success) {
        const completedTodo = todos.find(t => t.id === todoId);
        const wasCompleted = completedTodo?.completed;
        
        if (wasCompleted) {
          showToast("Tarefa marcada como pendente! XP removido.");
        } else {
          showToast(`Tarefa concluída! +${completedTodo?.xp || 10} XP obtidos.`);
        }
        
        if (Array.isArray(data.todos)) {
          setTodos(data.todos);
        } else {
          fetchTodos();
        }
        
        if (data.stats) setStats(data.stats);
        fetchHistory();
        fetchCalendarXp();
        fetchSchedule(date, true);
      }
    } catch (e) {
      console.error("Error toggling todo completion:", e);
      alert("Erro de rede ao alternar conclusão da tarefa.");
    }
  };

  const handleUpdateTodo = async (todoId, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE}/todos/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, ...updatedFields })
      });
      if (!res.ok) {
        alert("Erro ao atualizar tarefa.");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.todos)) {
        setTodos(data.todos);
        showToast("Tarefa atualizada!");
      } else {
        fetchTodos();
      }
    } catch (e) {
      console.error("Error updating todo:", e);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm("Deseja realmente remover esta tarefa? Isso anulará qualquer XP associado caso estivesse concluída.")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Tarefa removida.");
        if (Array.isArray(data.todos)) {
          setTodos(data.todos);
        } else {
          fetchTodos();
        }
        if (data.stats) setStats(data.stats);
        fetchHistory();
        fetchCalendarXp();
        fetchSchedule(date, true);
      } else {
        alert("Falha ao remover a tarefa.");
      }
    } catch (e) {
      console.error("Error deleting todo:", e);
      alert("Erro de conexão ao remover tarefa.");
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!session) return;
    fetchStats();
    fetchHistory();
    fetchGoals();
    fetchAiConfig();
    fetchDbConfig();
    fetchCalendarXp();
    fetchPhysicalSetup();
    fetchFinancialSetup();
    fetchBooks();
    fetchTodos();
  }, [session]);

  // Fetch schedule whenever date changes
  useEffect(() => {
    if (!session) return;
    fetchSchedule(date);
  }, [date, session]);

  // Global context values
  const contextValue = {
    // States
    theme, setTheme,
    navOpen, setNavOpen,
    date, setDate,
    schedule, setSchedule: setScheduleWithRef,
    stats, setStats,
    history, setHistory,
    loading, setLoading,
    toast, setToast,
    aiProvider, setAiProvider,
    aiApiKey, setAiApiKey,
    aiModel, setAiModel,
    aiEndpoint, setAiEndpoint,
    goals, setGoals,
    goalTitle, setGoalTitle,
    goalDuration, setGoalDuration,
    goalSphere, setGoalSphere,
    goalFreq, setGoalFreq,
    editingGoal, setEditingGoal,
    aiPromptNote, setAiPromptNote,
    aiGenerating, setAiGenerating,
    calendarXp, setCalendarXp,
    calYear, setCalYear,
    calMonth, setCalMonth,
    physicalSetup, setPhysicalSetup,
    desiredExercisesInput, setDesiredExercisesInput,
    aiPlanJson, setAiPlanJson,
    generatingPhysicalPlan, setGeneratingPhysicalPlan,
    savingPhysicalSetup, setSavingPhysicalSetup,
    editingPhysicalPlanText, setEditingPhysicalPlanText,
    physicalPlanText, setPhysicalPlanText,
    financialSetup, setFinancialSetup,
    financialGoalsInput, setFinancialGoalsInput,
    monthlyIncomeInput, setMonthlyIncomeInput,
    savingsTargetInput, setSavingsTargetInput,
    finPlanJson, setFinPlanJson,
    generatingFinPlan, setGeneratingFinPlan,
    savingFinSetup, setSavingFinSetup,
    editingFinPlanText, setEditingFinPlanText,
    finPlanText, setFinPlanText,
    books, setBooks,
    bookTitle, setBookTitle,
    bookAuthor, setBookAuthor,
    bookSphere, setBookSphere,
    bookPages, setBookPages,
    bookGoal, setBookGoal,
    bookDepth, setBookDepth,
    bookFilter, setBookFilter,
    addingBook, setAddingBook,
    loadingBooks, setLoadingBooks,
    actionTab, setActionTab,
    meetTitle, setMeetTitle,
    meetStart, setMeetStart,
    meetEnd, setMeetEnd,
    meetSphere, setMeetSphere,
    meetParentId, setMeetParentId,
    editingTask, setEditingTask,
    editTitle, setEditTitle,
    editStart, setEditStart,
    editEnd, setEditEnd,
    editSphere, setEditSphere,
    editXp, setEditXp,
    editDesc, setEditDesc,
    editCompleted, setEditCompleted,
    editParentId, setEditParentId,
    completionTask, setCompletionTask,
    completionDesc, setCompletionDesc,
    isCompleting,
    isSavingTask,
    isDeletingTask,
    session, setSession,
    dbProvider, dbConnectionString, dbHost, dbPort, dbDatabase, dbUsername, dbPassword, dbSsl, dbActive,
    testingDbConnection, activatingDb,
    isSavingAiConfig,

    // Todo list states
    todos, setTodos,
    todoTitle, setTodoTitle,
    todoLabel, setTodoLabel,
    todoSphere, setTodoSphere,
    todoXp, setTodoXp,
    todoDescription, setTodoDescription,
    todoParentId, setTodoParentId,
    loadingTodos, addingTodo,

    // Handlers
    showToast,
    triggerBrowserNotification,
    fetchStats,
    fetchSchedule,
    fetchHistory,
    fetchGoals,
    fetchAiConfig,
    fetchDbConfig,
    fetchCalendarXp,
    fetchPhysicalSetup,
    handleSaveDesiredExercises,
    handleGeneratePhysicalPlan,
    handleSavePhysicalPlanText,
    handleUpdateExerciseExecution,
    fetchFinancialSetup,
    handleSaveFinancialSetup,
    handleGenerateFinancialPlan,
    handleSaveFinPlanText,
    handleUpdateQuestValue,
    handleClaimQuestXp,
    fetchBooks,
    handleAddBook,
    handleToggleBook,
    handleDeleteBook,
    handleCompleteTask,
    handleFormSubmit,
    handleEditTask,
    handleDeleteTask,
    handleSaveAiConfig,
    handleTestDbConnection,
    handleActivateDbConnection,
    handleDeactivateDbConnection,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleGenerateAiSchedule,
    handleResetData,
    changeDate,
    changeCalendarMonth,
    getDaysInMonthGrid,
    formatDisplayDate,
    getMonthName,
    fetchTodos,
    handleAddTodo,
    handleCompleteTodo,
    handleUpdateTodo,
    handleDeleteTodo
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
