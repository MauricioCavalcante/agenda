/**
 * Ponto de entrada do Frontend (Rotas e Layout)
 * 
 * Responsável por:
 * - Prover o roteamento principal das páginas
 * - Renderizar a Sidebar e o layout base da aplicação
 * - Lidar com a transição entre telas
 */
import React, { useContext } from 'react';
import { BrowserRouter, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
  Award, Shield, Calendar, Target, Brain, BookOpen, Dumbbell, Coins, Sun, Moon, ChevronDown, Edit2, Trash2, CheckCircle2, Clock, Check, Database, RefreshCw, Settings, LogOut
} from 'lucide-react';

import { AppContext, AppProvider } from './context/AppContext';

// Pages
import Dashboard from './pages/Dashboard';
import CalendarXP from './pages/CalendarXP';
import RecurringGoals from './pages/RecurringGoals';
import WeeklyGrid from './pages/WeeklyGrid';
import AIConfig from './pages/AIConfig';
import PhysicalSphere from './pages/PhysicalSphere';
import FinancialSphere from './pages/FinancialSphere';
import Library from './pages/Library';
import Login from './pages/Auth/Login';
import DBConfig from './pages/DBConfig';
import TodoList from './pages/TodoList';

const getActiveTabLabel = (tab) => {
  switch (tab) {
    case 'dashboard': return 'Painel Geral';
    case 'calendar': return 'Calendário';
    case 'goals': return 'Metas';
    case 'weekly': return 'Configuração > Grade';
    case 'aiConfig': return 'Configuração > IA';
    case 'dbConfig': return 'Configuração > Banco';
    case 'physical': return 'Esfera Físico';
    case 'financial': return 'Esfera Financeira';
    case 'library': return 'Biblioteca';
    case 'todos': return 'Lista de Tarefas';
    default: return 'Painel Geral';
  }
};

const getActiveTabIcon = (tab) => {
  switch (tab) {
    case 'dashboard': return null;
    case 'calendar': return <Calendar size={14} style={{ marginRight: '4px' }} />;
    case 'goals': return <Target size={14} style={{ marginRight: '4px' }} />;
    case 'weekly': return <Settings size={14} style={{ marginRight: '4px' }} />;
    case 'aiConfig': return <Brain size={14} style={{ marginRight: '4px' }} />;
    case 'physical': return <Dumbbell size={14} style={{ marginRight: '4px' }} />;
    case 'financial': return <Coins size={14} style={{ marginRight: '4px' }} />;
    case 'library': return <BookOpen size={14} style={{ marginRight: '4px' }} />;
    case 'todos': return <CheckCircle2 size={14} style={{ marginRight: '4px' }} />;
    case 'dbConfig': return <Database size={14} style={{ marginRight: '4px' }} />;
    default: return null;
  }
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    theme, setTheme,
    navOpen, setNavOpen,
    toast,
    schedule,
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
    handleCompleteTask,
    handleEditTask,
    handleDeleteTask,
    activatingDb,
    generatingPhysicalPlan,
    generatingFinPlan,
    aiGenerating,
    isCompleting,
    isSavingTask,
    isDeletingTask,
    session
  } = useContext(AppContext);

  // Map route path to tab ID
  const getTabFromPath = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'dashboard';
      case '/calendar':
        return 'calendar';
      case '/goals':
        return 'goals';
      case '/weekly':
        return 'weekly';
      case '/ai-config':
        return 'aiConfig';
      case '/db-config':
        return 'dbConfig';
      case '/physical':
        return 'physical';
      case '/financial':
        return 'financial';
      case '/library':
        return 'library';
      case '/todos':
        return 'todos';
      default:
        return 'dashboard';
    }
  };

  // Redirect root path / to /dashboard is no longer needed since root is now dashboard
  // We can just keep the path parsing
  const activeTab = getTabFromPath(location.pathname);

  const setActiveTab = (tab) => {
    switch (tab) {
      case 'dashboard': navigate('/'); break;
      case 'calendar': navigate('/calendar'); break;
      case 'goals': navigate('/goals'); break;
      case 'weekly': navigate('/weekly'); break;
      case 'aiConfig': navigate('/ai-config'); break;
      case 'dbConfig': navigate('/db-config'); break;
      case 'physical': navigate('/physical'); break;
      case 'financial': navigate('/financial'); break;
      case 'library': navigate('/library'); break;
      case 'todos': navigate('/todos'); break;
      default: navigate('/');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className="toast">
          <Award size={18} className="text-system" style={{ color: 'var(--color-system)' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="glass-panel">
        <div className="brand" onClick={() => session && setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Shield size={24} style={{ color: 'var(--color-system)' }} />
          <h1>LevelUp Routine</h1>
          <span>Skill RPG</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {session && (
          <div className="nav-container">
            <button 
              className="btn btn-secondary nav-mobile-toggle"
              onClick={() => setNavOpen(!navOpen)}
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {getActiveTabIcon(activeTab)}
              <span>{getActiveTabLabel(activeTab)}</span>
              <ChevronDown size={14} style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: navOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            <div className={`nav-list ${navOpen ? 'open' : ''}`}>
              <button 
                className={`btn ${activeTab === 'dashboard' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('dashboard'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Painel Geral
              </button>
              <button 
                className={`btn ${activeTab === 'calendar' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('calendar'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Calendar size={14} />
                Calendário
              </button>
              <button 
                className={`btn ${activeTab === 'goals' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('goals'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Target size={14} />
                Tarefas Recorrentes
              </button>
              <button 
                className={`btn ${activeTab === 'library' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('library'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BookOpen size={14} />
                Biblioteca
              </button>
              <button 
                className={`btn ${activeTab === 'todos' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('todos'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle2 size={14} />
                Tarefas
              </button>
              <button 
                className={`btn ${activeTab === 'aiConfig' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('aiConfig'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Brain size={14} />
                IA Config
              </button>
              <button 
                className={`btn ${activeTab === 'dbConfig' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('dbConfig'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Database size={14} />
                Banco
              </button>
              
            </div>
          </div>
          )}
          
          {session && (
            <button 
              className="btn btn-secondary"
              onClick={async () => {
                const { supabase } = await import('./lib/supabase');
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b' }}
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          )}

          <button 
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* Page Routing */}
      <Routes>
        <Route path="/login" element={<Login />} />
        {session ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarXP />} />
            <Route path="/goals" element={<RecurringGoals />} />
            <Route path="/weekly" element={<WeeklyGrid />} />
            <Route path="/ai-config" element={<AIConfig />} />
            <Route path="/db-config" element={<DBConfig />} />
            <Route path="/physical" element={<PhysicalSphere />} />
            <Route path="/financial" element={<FinancialSphere />} />
            <Route path="/library" element={<Library />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="*" element={<Dashboard />} />
          </>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>

      {/* Edit Activity Dialog Modal */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Edit2 size={20} style={{ color: 'var(--color-system)' }} />
              Editar Atividade
            </h3>
            
            <form onSubmit={handleEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Título do Compromisso</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Início</label>
                  <input 
                    type="time" 
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora Fim</label>
                  <input 
                    type="time" 
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Esfera Vinculada</label>
                  <select value={editSphere} onChange={(e) => setEditSphere(e.target.value)}>
                    <option value="Profissional">💼 Profissional</option>
                    <option value="Educacional">🎓 Educacional</option>
                    <option value="Pessoal">🟢 Pessoal</option>
                    <option value="Físico">🏃‍♂️ Físico</option>
                    <option value="Financeiro">💰 Financeiro</option>
                    <option value="Social">👥 Social</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>XP da Atividade</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editXp}
                    onChange={(e) => setEditXp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tarefa Principal Relacionada (Para atividade paralela)</label>
                <select value={editParentId || ''} onChange={(e) => setEditParentId(e.target.value || null)}>
                  <option value="">Nenhuma (Atividade normal)</option>
                  {schedule.filter(t => !t.parentId && t.id !== editingTask.id).map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.startTime} - {t.endTime}] {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                <input 
                  type="checkbox" 
                  id="editCompleted"
                  checked={editCompleted}
                  onChange={(e) => {
                    setEditCompleted(e.target.checked);
                    if (!e.target.checked) setEditDesc('');
                  }}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="editCompleted" style={{ cursor: 'pointer', fontWeight: '500' }}>
                  Marcar atividade como concluída
                </label>
              </div>

              {editCompleted && (
                <div className="form-group">
                  <label>O que foi feito? (Relatório de Atividade)</label>
                  <textarea 
                    rows="3" 
                    placeholder="Descreva brevemente o que foi realizado..." 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required={editCompleted}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button 
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="btn btn-secondary" 
                  style={{ color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={isSavingTask || isDeletingTask}
                >
                  {isDeletingTask ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {isDeletingTask ? "Carregando..." : "Excluir"}
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingTask(null)}
                    className="btn btn-secondary"
                    disabled={isSavingTask || isDeletingTask}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={isSavingTask || isDeletingTask}
                  >
                    {isSavingTask && <RefreshCw size={14} className="animate-spin" />}
                    {isSavingTask ? "Carregando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Dialog Modal */}
      {completionTask && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--color-professional)' }} />
              Concluir Atividade
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: '600', fontSize: '1rem' }}>{completionTask.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Esfera: {completionTask.sphere} | Recompensa: +{completionTask.xp} XP
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>O que foi feito? (Descreva brevemente a atividade)</label>
              <textarea 
                rows="3" 
                placeholder="ex: Desenvolvi o endpoint de login, estudei capítulo 3 de redes de computadores, etc." 
                value={completionDesc}
                onChange={(e) => setCompletionDesc(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setCompletionTask(null)}
                className="btn btn-secondary"
                disabled={isCompleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCompleteTask}
                className="btn"
                disabled={isCompleting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isCompleting && <RefreshCw size={14} className="animate-spin" />}
                {isCompleting ? "Carregando..." : "Registrar e Ganhar XP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global AI / Database Activity loaders */}
      {activatingDb && (
        <div className="global-loader-overlay">
          <div className="global-loader-card">
            <div className="loader-orb"></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Conectando Banco de Dados</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Migrando dados locais e estabelecendo conexão segura com o Supabase/PostgreSQL...
            </p>
          </div>
        </div>
      )}

      {(generatingPhysicalPlan || generatingFinPlan) && (
        <div className="global-loader-overlay">
          <div className="global-loader-card">
            <div className="loader-orb"></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Gerando Plano com IA</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              O mestre da guilda está calculando suas metas e XP personalizado...
            </p>
          </div>
        </div>
      )}

      {aiGenerating && (
        <div className="global-loader-overlay">
          <div className="global-loader-card">
            <div className="loader-orb"></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Reorganizando com IA</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ajustando sua rotina e otimizando os blocos de tempo via LLM...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
