/**
 * Dashboard (Página Inicial)
 * 
 * Visão principal do dia. Renderiza a timeline de atividades diárias,
 * tarefas pendentes e status atual das esferas do usuário.
 */
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Smile, 
  Clock, 
  PlusCircle, 
  History as HistoryIcon, 
  RefreshCw, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Check, 
  Sparkles,
  Dumbbell,
  Coins,
  Users,
  Circle,
  Tag
} from 'lucide-react';
import { AppContext, getTodayString } from '../context/AppContext';

const getSphereIcon = (sphere) => {
  switch (sphere) {
    case 'Profissional':
      return <Briefcase size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    case 'Educacional':
      return <GraduationCap size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    case 'Pessoal':
      return <Smile size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    case 'Físico':
      return <Dumbbell size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    case 'Financeiro':
      return <Coins size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    case 'Social':
      return <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
    default:
      return <Shield size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />;
  }
};

const getSphereClass = (sphere) => {
  switch (sphere) {
    case 'Profissional': return 'professional';
    case 'Educacional': return 'educational';
    case 'Pessoal': return 'personal';
    case 'Físico': return 'physical';
    case 'Financeiro': return 'financial';
    case 'Social': return 'social';
    default: return 'personal';
  }
};

const formatDisplayDate = (dateStr) => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  return dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    session,
    stats,
    date,
    schedule,
    history,
    loading,
    actionTab,
    setActionTab,
    meetTitle,
    setMeetTitle,
    meetStart,
    setMeetStart,
    meetEnd,
    setMeetEnd,
    meetSphere,
    setMeetSphere,
    meetParentId,
    setMeetParentId,
    aiPromptNote,
    setAiPromptNote,
    aiGenerating,
    handleResetData,
    handleGenerateAiSchedule,
    handleFormSubmit,
    setEditingTask,
    setEditTitle,
    setEditStart,
    setEditEnd,
    setEditSphere,
    setEditXp,
    setEditDesc,
    setEditCompleted,
    setEditParentId,
    setCompletionTask,
    setCompletionDesc,
    changeDate,
    fetchSchedule,
    todos,
    handleCompleteTodo
  } = useContext(AppContext);

  // Filter tasks out that have parentId to render them nested
  const mainTimelineTasks = schedule.filter(task => !task.parentId);

  return (
    <div className="dashboard-grid">
      
      {/* Left Column: Character Stats & Action Card */}
      <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Stats Card */}
        <div className="profile-card glass-panel">
          <div className="char-info">
            <div className="avatar-shield">
              {stats?.characterLevel || 1}
            </div>
            <div className="char-title">
              <h2>{session?.user?.user_metadata?.full_name || 'Aventureiro(a)'}</h2>
              <p>{stats?.title || 'Iniciante'}</p>
            </div>
          </div>

          {/* Hexagonal Radar Chart */}
          {stats && (
            <div className="radar-chart-container">
              <svg width="230" height="230" viewBox="0 0 230 230" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--color-system)" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="var(--color-system)" stopOpacity="0.32" />
                  </radialGradient>
                </defs>

                {/* Outer hexagon and grid lines */}
                {[20, 40, 60, 80, 100].map((gridVal) => {
                  const points = [
                    'Profissional', 'Educacional', 'Pessoal', 
                    'Físico', 'Financeiro', 'Social'
                  ].map((name, i) => {
                    const angle = -Math.PI / 2 + i * Math.PI / 3;
                    const r = (gridVal / 100) * 75;
                    const x = 115 + r * Math.cos(angle);
                    const y = 115 + r * Math.sin(angle);
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polygon
                      key={gridVal}
                      points={points}
                      className="radar-grid-line"
                    />
                  );
                })}

                {/* Axis lines */}
                {[...Array(6)].map((_, i) => {
                  const angle = -Math.PI / 2 + i * Math.PI / 3;
                  const x2 = 115 + 75 * Math.cos(angle);
                  const y2 = 115 + 75 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1="115"
                      y1="115"
                      x2={x2}
                      y2={y2}
                      className="radar-axis"
                    />
                  );
                })}

                {/* Stats filled polygon area */}
                {(() => {
                  const spheresList = [
                    'Profissional', 'Educacional', 'Pessoal', 
                    'Físico', 'Financeiro', 'Social'
                  ];
                  const points = spheresList.map((name, i) => {
                    const level = stats.spheres[name]?.level || 1;
                    const angle = -Math.PI / 2 + i * Math.PI / 3;
                    const r = (Math.max(5, level) / 100) * 75;
                    const x = 115 + r * Math.cos(angle);
                    const y = 115 + r * Math.sin(angle);
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polygon
                      points={points}
                      className="radar-polygon"
                      fill="url(#radar-glow)"
                    />
                  );
                })()}

                {/* Vertex labels */}
                {[
                  { name: 'Profissional', label: '💼 Prof', align: 'middle', dy: '-8px' },
                  { name: 'Educacional', label: '🎓 Edu', align: 'start', dx: '4px', dy: '4px' },
                  { name: 'Pessoal', label: '👤 Pess', align: 'start', dx: '4px', dy: '8px' },
                  { name: 'Físico', label: '🏃‍♂️ Fís', align: 'middle', dy: '14px' },
                  { name: 'Financeiro', label: '💰 Fin', align: 'end', dx: '-4px', dy: '8px' },
                  { name: 'Social', label: '👥 Soc', align: 'end', dx: '-4px', dy: '4px' }
                ].map((item, i) => {
                  const angle = -Math.PI / 2 + i * Math.PI / 3;
                  const level = stats.spheres[item.name]?.level || 1;
                  const x = 115 + 88 * Math.cos(angle);
                  const y = 115 + 88 * Math.sin(angle);
                  
                  return (
                    <text
                      key={item.name}
                      x={x}
                      y={y}
                      textAnchor={item.align}
                      className="radar-label"
                      dx={item.dx || '0'}
                      dy={item.dy || '0'}
                    >
                      {item.label}
                      <tspan className="radar-label-value" dx="2px" dy="0">
                        (N.{level})
                      </tspan>
                    </text>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Sphere Bars */}
          <div className="spheres-container">
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Esferas de Habilidade
            </h3>
            
            {stats && Object.entries(stats.spheres).map(([name, sphere]) => {
              const percent = Math.min(100, Math.floor((sphere.xp / (sphere.level * 100)) * 100));
              const sphereClass = getSphereClass(name);
              return (
                <div key={name} className={`sphere-card ${sphereClass}`}>
                  <div className="sphere-header">
                    <span className="sphere-name">
                      {getSphereIcon(name)}
                      {name}
                    </span>
                    <span className="sphere-level">Nível {sphere.level}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="sphere-xp-label">
                    <span>XP: {sphere.xp} / {sphere.level * 100}</span>
                    <span>{percent}%</span>
                  </div>
                  {name === 'Físico' && (
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-start' }}>
                      <a 
                        href="/physical"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/physical');
                        }}
                        className="sphere-link"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-physical)',
                          textDecoration: 'none',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          borderBottom: '1px dashed var(--color-physical)',
                          paddingBottom: '1px'
                        }}
                      >
                        <Dumbbell size={10} />
                        Ver Esfera Físico →
                      </a>
                    </div>
                  )}
                  {name === 'Financeiro' && (
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-start' }}>
                      <a 
                        href="/financial"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/financial');
                        }}
                        className="sphere-link"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-financial)',
                          textDecoration: 'none',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          borderBottom: '1px dashed var(--color-financial)',
                          paddingBottom: '1px'
                        }}
                      >
                        <Coins size={10} />
                        Ver Esfera Financeira →
                      </a>
                    </div>
                  )}
                  <span className="sphere-title-tag">{sphere.title}</span>
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleResetData}
            className="btn btn-secondary" 
            style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 12px', alignSelf: 'flex-start', color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.3)' }}
          >
            Zerar Progresso (Dev)
          </button>
        </div>

        {/* AI Generator Prompter */}
        <div className="action-card glass-panel" style={{ border: '1px solid hsla(210, 90%, 55%, 0.3)', background: 'linear-gradient(145deg, hsla(222, 20%, 15%, 0.7), hsla(210, 90%, 55%, 0.03))' }}>
          <h3 style={{ color: 'var(--color-system)' }}>
            <Sparkles size={18} />
            Organizar com IA
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '8px' }}>
            A IA analisa suas metas recorrentes e insere atividades intercaladas nos blocos de menor demanda do dia!
          </p>
          
          <div className="form-group">
            <label>Notas/Instruções para hoje</label>
            <textarea 
              rows="3"
              placeholder="ex: Hoje o CLT está calmo, intercale mais cursos acadêmicos. Quero focar em ler no fim da tarde."
              value={aiPromptNote}
              onChange={(e) => setAiPromptNote(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
          
          <button 
            onClick={handleGenerateAiSchedule} 
            disabled={aiGenerating}
            className="btn"
            style={{ background: 'var(--grad-system)' }}
          >
            {aiGenerating ? "Processando LLM..." : "Estruturar Agenda via IA"}
          </button>
        </div>

        {/* Quick Action: Insert Task/Meeting Manually */}
        <div className="action-card glass-panel">
          <h3>
            <PlusCircle size={18} style={{ color: 'var(--color-system)' }} />
            Adicionar Atividade Manual
          </h3>
          
          <div style={{ display: 'flex', gap: '6px', margin: '4px 0 12px 0', background: 'hsla(217, 20%, 15%, 0.8)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setActionTab('meeting')}
              className="btn"
              style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', background: actionTab === 'meeting' ? 'var(--grad-system)' : 'transparent', boxShadow: 'none' }}
            >
              Deslocar (Reunião)
            </button>
            <button
              type="button"
              onClick={() => setActionTab('fixed')}
              className="btn"
              style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', background: actionTab === 'fixed' ? 'var(--grad-system)' : 'transparent', boxShadow: 'none' }}
            >
              Fixar (Tarefa)
            </button>
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group full">
              <label>Título do Compromisso</label>
              <input 
                type="text" 
                placeholder={actionTab === 'meeting' ? "ex: Reunião CLT urgente" : "ex: Estudo extra"} 
                value={meetTitle}
                onChange={(e) => setMeetTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hora Início</label>
                <input 
                  type="time" 
                  value={meetStart}
                  onChange={(e) => setMeetStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hora Fim</label>
                <input 
                  type="time" 
                  value={meetEnd}
                  onChange={(e) => setMeetEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group full">
              <label>Esfera Vinculada</label>
              <select value={meetSphere} onChange={(e) => setMeetSphere(e.target.value)}>
                <option value="Profissional">💼 Profissional</option>
                <option value="Educacional">🎓 Educacional</option>
                <option value="Pessoal">🟢 Pessoal</option>
                <option value="Físico">🏃‍♂️ Físico</option>
                <option value="Financeiro">💰 Financeiro</option>
                <option value="Social">👥 Social</option>
              </select>
            </div>

            {actionTab === 'fixed' && (
              <div className="form-group full">
                <label>Tarefa Principal Relacionada (Para atividade paralela)</label>
                <select value={meetParentId || ''} onChange={(e) => setMeetParentId(e.target.value || null)}>
                  <option value="">Nenhuma (Atividade normal)</option>
                  {schedule.filter(t => !t.parentId).map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.startTime} - {t.endTime}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn">
              {actionTab === 'meeting' ? 'Reorganizar com Reunião' : 'Inserir Horário Fixo'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Schedule & Timeline */}
      <div className="timeline-section">
        
        {/* Header controls for Date selection */}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="date-picker">
            <button onClick={() => changeDate(-1)} className="date-btn" title="Dia Anterior">
              <ChevronLeft size={18} />
            </button>
            <div className="date-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-system)', fontWeight: '700', textTransform: 'uppercase' }}>
                {date === getTodayString() ? "Hoje" : "Planejamento"}
              </span>
              <span>{formatDisplayDate(date)}</span>
            </div>
            <button onClick={() => changeDate(1)} className="date-btn" title="Próximo Dia">
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => fetchSchedule(date)} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px' }} 
              title="Atualizar Agenda"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* List of Scheduled Blocks */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-system)' }} />
            Cronograma do Dia
          </h3>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner-ring"></div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Carregando sua grade de horários...
              </p>
            </div>
          ) : schedule.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum compromisso para este dia. Aproveite seu tempo livre!
            </div>
          ) : (
            <div className="timeline-list">
              {mainTimelineTasks.map((task) => {
                const sphereClass = getSphereClass(task.sphere);
                // Get child interleaved tasks
                const children = schedule.filter(child => child.parentId === task.id);
                
                return (
                  <div 
                    key={task.id} 
                    className={`timeline-item ${sphereClass} ${task.completed ? 'completed' : ''}`}
                  >
                    <div className="time-badge">
                      <span className="start-time">{task.startTime}</span>
                      <span className="end-time">{task.endTime}</span>
                    </div>
                    <div className="timeline-node"></div>
                    <div className={`task-card glass-panel ${task.completed ? 'completed' : ''} ${task.isMeeting ? 'meeting' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      
                      {/* Main Task Core Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div className="task-details">
                          <h4 className="task-title">
                            {task.title}
                            {task.completed && <CheckCircle2 size={16} style={{ color: 'var(--color-professional)' }} />}
                          </h4>
                          <div className="task-meta">
                            <span className="sphere-tag">{task.sphere}</span>
                            {task.duration && <span><Clock size={12} /> {task.duration}</span>}
                            {task.xp > 0 && (
                              <span className="xp-badge">
                                +{task.xp} XP
                              </span>
                            )}
                          </div>
                          {task.completed && task.description && (
                            <p className="task-desc">
                              <strong>Relatório:</strong> {task.description}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              setEditingTask(task);
                              setEditTitle(task.title);
                              setEditStart(task.startTime);
                              setEditEnd(task.endTime);
                              setEditSphere(task.sphere);
                              setEditXp(task.xp);
                              setEditDesc(task.description || '');
                              setEditCompleted(task.completed);
                              setEditParentId(task.parentId || null);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
                          
                          {!task.completed && (
                            <button 
                              onClick={() => {
                                setCompletionTask(task);
                                setCompletionDesc('');
                              }}
                              className="btn" 
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '0.85rem', 
                                background: `var(--grad-${getSphereClass(task.sphere)})` 
                              }}
                            >
                              <Check size={14} />
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nested Interleaved Tasks (Children) */}
                      {children.length > 0 && (
                        <div className="nested-tasks-container">
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '16px' }}>
                            Atividades Intercaladas (Paralelas)
                          </span>
                          {children.map(child => {
                            const childSphereClass = getSphereClass(child.sphere);
                            return (
                              <div key={child.id} className={`nested-task-card ${childSphereClass} glass-panel`}>
                                <div className="task-details">
                                  <h5 className="task-title" style={{ fontSize: '0.9rem' }}>
                                    {child.title}
                                    {child.completed && <CheckCircle2 size={13} style={{ color: 'var(--color-professional)' }} />}
                                  </h5>
                                  <div className="task-meta" style={{ fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>⏱️ {child.startTime} - {child.endTime}</span>
                                    <span className="xp-badge">+{child.xp} XP</span>
                                  </div>
                                  {child.completed && child.description && (
                                    <p className="task-desc" style={{ fontSize: '0.8rem' }}>
                                      <strong>Feito:</strong> {child.description}
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <button 
                                    onClick={() => {
                                      setEditingTask(child);
                                      setEditTitle(child.title);
                                      setEditStart(child.startTime);
                                      setEditEnd(child.endTime);
                                      setEditSphere(child.sphere);
                                      setEditXp(child.xp);
                                      setEditDesc(child.description || '');
                                      setEditCompleted(child.completed);
                                      setEditParentId(child.parentId);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', gap: '2px', alignItems: 'center' }}
                                  >
                                    <Edit2 size={10} />
                                    Editar
                                  </button>
                                  
                                  {!child.completed && (
                                    <button 
                                      onClick={() => {
                                        setCompletionTask(child);
                                        setCompletionDesc('');
                                      }}
                                      className="btn" 
                                      style={{ 
                                        padding: '4px 8px', 
                                        fontSize: '0.75rem', 
                                        background: `var(--grad-${getSphereClass(child.sphere)})` 
                                      }}
                                    >
                                      Concluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Todo Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-system)' }} />
              Tarefas Rápidas
            </h3>
            <button 
              onClick={() => navigate('/todos')} 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Gerenciar Todas →
            </button>
          </div>

          {todos.filter(t => !t.completed).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              Nenhuma tarefa pendente! Bom trabalho, herói! 🏆
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todos.filter(t => !t.completed).slice(0, 5).map(todo => {
                const sphereClass = getSphereClass(todo.sphere);
                return (
                  <div 
                    key={todo.id} 
                    className={`task-card glass-panel ${sphereClass}`}
                    style={{ 
                      padding: '10px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <button
                        onClick={() => handleCompleteTodo(todo.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.1s'
                        }}
                        title="Marcar como concluída"
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Circle size={18} className="hover-scale" style={{ color: 'var(--border-color)' }} />
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{todo.title}</span>
                        {todo.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {todo.description}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-system)', fontWeight: '600', background: 'rgba(33, 150, 243, 0.08)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Tag size={8} /> {todo.label}
                          </span>
                          <span className="sphere-tag" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            {todo.sphere}
                          </span>
                          {todo.parentId && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              ↳ Subtarefa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="xp-badge" style={{ fontSize: '0.7rem', padding: '3px 6px', background: `var(--grad-${sphereClass})`, color: '#fff' }}>
                      +{todo.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History Logs */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryIcon size={18} style={{ color: 'var(--color-system)' }} />
            Histórico de Conclusões Recentes
          </h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Nenhuma atividade concluída no histórico ainda. Comece a evoluir suas skills!
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getSphereIcon(item.sphere)}
                      {item.sphere}
                    </span>
                    <span>{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="history-title">{item.title}</div>
                  <div className="history-desc">
                    <strong>Relatório:</strong> {item.description}
                  </div>
                  <div style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: 'var(--color-system)', fontWeight: '700' }}>
                    +{item.xpEarned} XP Ganho
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
