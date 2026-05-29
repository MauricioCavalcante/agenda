import React, { useContext } from 'react';
import { HashRouter, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { 
  Award, Shield, Calendar, Target, Brain, BookOpen, Dumbbell, Coins, Sun, Moon, ChevronDown, Edit2, Trash2, CheckCircle2, Clock, Check
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

const getActiveTabLabel = (tab) => {
  switch (tab) {
    case 'dashboard': return 'Painel Geral';
    case 'calendar': return 'Calendário de XP';
    case 'goals': return 'Metas Recorrentes';
    case 'weekly': return 'Grade Semanal Padrão';
    case 'aiConfig': return 'IA Config';
    case 'physical': return 'Esfera Físico';
    case 'financial': return 'Esfera Financeira';
    case 'library': return 'Biblioteca';
    default: return 'Painel Geral';
  }
};

const getActiveTabIcon = (tab) => {
  switch (tab) {
    case 'dashboard': return null;
    case 'calendar': return <Calendar size={14} style={{ marginRight: '4px' }} />;
    case 'goals': return <Target size={14} style={{ marginRight: '4px' }} />;
    case 'weekly': return null;
    case 'aiConfig': return <Brain size={14} style={{ marginRight: '4px' }} />;
    case 'physical': return <Dumbbell size={14} style={{ marginRight: '4px' }} />;
    case 'financial': return <Coins size={14} style={{ marginRight: '4px' }} />;
    case 'library': return <BookOpen size={14} style={{ marginRight: '4px' }} />;
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
    handleDeleteTask
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
      case '/physical':
        return 'physical';
      case '/financial':
        return 'financial';
      case '/library':
        return 'library';
      default:
        return 'dashboard';
    }
  };

  const activeTab = getTabFromPath(location.pathname);

  // Redirect root path / to /dashboard
  React.useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const setActiveTab = (tab) => {
    switch (tab) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'calendar': navigate('/calendar'); break;
      case 'goals': navigate('/goals'); break;
      case 'weekly': navigate('/weekly'); break;
      case 'aiConfig': navigate('/ai-config'); break;
      case 'physical': navigate('/physical'); break;
      case 'financial': navigate('/financial'); break;
      case 'library': navigate('/library'); break;
      default: navigate('/dashboard');
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
        <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Shield size={24} style={{ color: 'var(--color-system)' }} />
          <h1>LevelUp Routine</h1>
          <span>Skill RPG</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <Calendar size={14} style={{ marginRight: '4px' }} />
                Calendário de XP
              </button>
              <button 
                className={`btn ${activeTab === 'goals' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('goals'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <Target size={14} style={{ marginRight: '4px' }} />
                Metas Recorrentes
              </button>
              <button 
                className={`btn ${activeTab === 'weekly' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('weekly'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Grade Semanal Padrão
              </button>
              <button 
                className={`btn ${activeTab === 'aiConfig' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('aiConfig'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <Brain size={14} style={{ marginRight: '4px' }} />
                IA Config
              </button>
              <button 
                className={`btn ${activeTab === 'library' ? '' : 'btn-secondary'}`}
                onClick={() => { setActiveTab('library'); setNavOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <BookOpen size={14} style={{ marginRight: '4px' }} />
                Biblioteca
              </button>
            </div>
          </div>
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarXP />} />
        <Route path="/goals" element={<RecurringGoals />} />
        <Route path="/weekly" element={<WeeklyGrid />} />
        <Route path="/ai-config" element={<AIConfig />} />
        <Route path="/physical" element={<PhysicalSphere />} />
        <Route path="/financial" element={<FinancialSphere />} />
        <Route path="/library" element={<Library />} />
        <Route path="*" element={<Dashboard />} />
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
                  style={{ color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.3)' }}
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingTask(null)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn">
                    Salvar Alterações
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
              >
                Cancelar
              </button>
              <button 
                onClick={handleCompleteTask}
                className="btn"
              >
                Registrar e Ganhar XP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}
