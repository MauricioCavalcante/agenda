import React, { useContext, useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  PlusCircle, 
  Trash2, 
  Tag, 
  Briefcase, 
  GraduationCap, 
  Smile, 
  Dumbbell, 
  Coins, 
  Users, 
  Shield, 
  Filter,
  CornerDownRight,
  FileText,
  Edit2,
  X
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const getSphereIcon = (sphere) => {
  switch (sphere) {
    case 'Profissional': return <Briefcase size={14} />;
    case 'Educacional': return <GraduationCap size={14} />;
    case 'Pessoal': return <Smile size={14} />;
    case 'Físico': return <Dumbbell size={14} />;
    case 'Financeiro': return <Coins size={14} />;
    case 'Social': return <Users size={14} />;
    default: return <Shield size={14} />;
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

// Gera cores exclusivas e consistentes por etiqueta
const getTagColorStyles = (tag) => {
  if (!tag || tag === 'all') return {};
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    background: `hsla(${hue}, 80%, 50%, 0.08)`,
    border: `1px solid hsla(${hue}, 85%, 50%, 0.18)`,
    color: `hsl(${hue}, 85%, 42%)`
  };
};

export default function TodoList() {
  const {
    todos,
    todoTitle, setTodoTitle,
    todoLabel, setTodoLabel,
    todoSphere, setTodoSphere,
    todoXp, setTodoXp,
    todoDescription, setTodoDescription,
    todoParentId, setTodoParentId,
    loadingTodos,
    addingTodo,
    handleAddTodo,
    handleCompleteTodo,
    handleDeleteTodo,
    handleUpdateTodo
  } = useContext(AppContext);

  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedTag, setSelectedTag] = useState('all'); // 'all' or specific tag string
  const [editingTodoId, setEditingTodoId] = useState(null); // ID da tarefa em edição

  // Obter etiquetas únicas presentes nas tarefas para criar a barra de filtros
  const uniqueTags = ['all', ...new Set(todos.map(t => t.label).filter(Boolean))];

  // Filtragem das tarefas
  const filteredTodos = todos.filter(todo => {
    if (activeFilterTab === 'pending' && todo.completed) return false;
    if (activeFilterTab === 'completed' && !todo.completed) return false;
    if (selectedTag !== 'all' && todo.label !== selectedTag) return false;
    return true;
  });

  // Separar tarefas pai das subtarefas para renderização hierárquica
  const parentTodos = filteredTodos.filter(todo => !todo.parentId);
  
  // Subtarefas órfãs (caso o pai tenha sido excluído ou não esteja no filtro atual)
  const orphanSubtasks = filteredTodos.filter(todo => todo.parentId && !todos.some(p => p.id === todo.parentId));

  // Etiquetas sugeridas/rápidas
  const quickLabels = ["Casa", "Anatel", "Aldrei", "Mentoria", "Trabalho", "Estudos"];

  // Iniciar modo de edição
  const startEditMode = (todo) => {
    setEditingTodoId(todo.id);
    setTodoTitle(todo.title);
    setTodoDescription(todo.description || '');
    setTodoLabel(todo.label);
    setTodoSphere(todo.sphere);
    setTodoXp(todo.xp);
    setTodoParentId(todo.parentId || '');
    
    // Rolar até o formulário de edição (comportamento amigável)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar edição
  const cancelEditMode = () => {
    setEditingTodoId(null);
    setTodoTitle('');
    setTodoDescription('');
    setTodoLabel('');
    setTodoXp(10);
    setTodoParentId('');
  };

  // Enviar formulário (Criar ou Atualizar)
  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!todoTitle || !todoLabel) return;

    if (editingTodoId) {
      // Modo de Edição
      await handleUpdateTodo(editingTodoId, {
        title: todoTitle,
        description: todoDescription,
        label: todoLabel,
        sphere: todoSphere,
        xp: Number(todoXp),
        parentId: todoParentId || null
      });
      cancelEditMode();
    } else {
      // Modo de Criação normal
      await handleAddTodo(e);
    }
  };

  // Função recursiva para renderizar uma tarefa e suas subtarefas
  const renderTodoCard = (todo, isSubtask = false) => {
    const sphereClass = getSphereClass(todo.sphere);
    const subtasks = filteredTodos.filter(t => t.parentId === todo.id);
    const tagStyle = getTagColorStyles(todo.label);

    // Calcular progresso baseado em todas as subtarefas reais (não apenas as filtradas)
    const allSubtasks = todos.filter(t => t.parentId === todo.id);
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter(t => t.completed).length;
    const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return (
      <div key={todo.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          className={`task-card glass-panel ${todo.completed ? 'completed' : ''} ${sphereClass}`}
          style={{ 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '12px',
            opacity: todo.completed ? 0.7 : 1,
            marginLeft: isSubtask ? '28px' : '0px',
            borderLeft: isSubtask ? '3px solid var(--border-color)' : undefined,
            border: editingTodoId === todo.id ? '2px solid var(--color-system)' : undefined,
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
            
            {isSubtask && (
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                <CornerDownRight size={16} />
              </div>
            )}

            <button
              onClick={() => handleCompleteTodo(todo.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: todo.completed ? 'var(--color-professional)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '3px',
                transition: 'transform 0.1s'
              }}
              title={todo.completed ? "Desmarcar como concluída (remove XP)" : "Marcar como concluída (+XP)"}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {todo.completed ? (
                <CheckCircle2 size={20} style={{ color: 'var(--color-professional)' }} />
              ) : (
                <Circle size={20} className="hover-scale" style={{ color: 'var(--border-color)' }} />
              )}
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', width: '100%' }}>
              <span style={{ 
                fontSize: '0.95rem', 
                fontWeight: '600',
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'var(--text-muted)' : 'var(--text-color)'
              }}>
                {todo.title}
              </span>

              {/* Descrição / Observações */}
              {todo.description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px', fontStyle: 'italic' }}>
                  <FileText size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{todo.description}</span>
                </div>
              )}

              {/* Barra de Progresso das Subtarefas */}
              {!isSubtask && totalSubtasks > 0 && (
                <div style={{ marginTop: '8px', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', maxWidth: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>Progresso das demandas ({completedSubtasks}/{totalSubtasks})</span>
                    <span style={{ fontWeight: '700' }}>{progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${progressPercent}%`, 
                      height: '100%', 
                      background: `var(--grad-${sphereClass})`, 
                      borderRadius: '3px',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span 
                  className="sphere-tag"
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  {getSphereIcon(todo.sphere)}
                  {todo.sphere}
                </span>
                
                {/* Tag com cor gerada dinamicamente */}
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: '600',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  ...tagStyle
                }}>
                  <Tag size={9} />
                  {todo.label}
                </span>

                {todo.completed && todo.doneAt && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Concluído em: {new Date(todo.doneAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="xp-badge" 
              style={{ 
                fontSize: '0.75rem',
                padding: '4px 8px',
                background: todo.completed ? 'var(--glass-bg)' : `var(--grad-${sphereClass})`,
                color: todo.completed ? 'var(--text-muted)' : '#fff',
                boxShadow: todo.completed ? 'none' : '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              +{todo.xp} XP
            </span>

            {/* Botão de Editar */}
            <button
              onClick={() => startEditMode(todo)}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', color: 'var(--color-system)', borderColor: 'hsla(210, 90%, 55%, 0.15)' }}
              title="Editar Tarefa (inclui descrição)"
            >
              <Edit2 size={13} />
            </button>

            {/* Botão de Excluir */}
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.2)' }}
              title="Excluir Tarefa"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Renderizar subtarefas recursivamente */}
        {subtasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subtasks.map(subtask => renderTodoCard(subtask, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      
      {/* Coluna Esquerda: Listagem de Tarefas */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <CheckCircle2 size={22} style={{ color: 'var(--color-system)' }} />
            Suas Tarefas de Guilda
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--glass-bg)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {todos.filter(t => !t.completed).length} pendentes
          </span>
        </div>

        {/* Abas de Conclusão */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => { setActiveFilterTab('all'); setSelectedTag('all'); }}
            className={`btn ${activeFilterTab === 'all' ? '' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Todas
          </button>
          <button
            onClick={() => { setActiveFilterTab('pending'); setSelectedTag('all'); }}
            className={`btn ${activeFilterTab === 'pending' ? '' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Pendentes
          </button>
          <button
            onClick={() => { setActiveFilterTab('completed'); setSelectedTag('all'); }}
            className={`btn ${activeFilterTab === 'completed' ? '' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Concluídas
          </button>
        </div>

        {/* Filtros por Etiqueta (Tags) com Cores Exclusivas */}
        {uniqueTags.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Filter size={12} /> Filtrar por Etiqueta:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {uniqueTags.map(tag => {
                const tagColorStyles = getTagColorStyles(tag);
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      ...(isSelected 
                        ? { 
                            background: tag === 'all' ? 'var(--color-system)' : tagColorStyles.color, 
                            color: '#fff', 
                            border: `1px solid ${tag === 'all' ? 'var(--color-system)' : tagColorStyles.color}` 
                          } 
                        : { 
                            background: 'var(--glass-bg)', 
                            color: 'var(--text-secondary)', 
                            border: '1px solid var(--border-color)',
                            ...tagColorStyles,
                            background: tagColorStyles.background || 'var(--glass-bg)' 
                          })
                    }}
                  >
                    {tag === 'all' ? '🏷️ Todas as Tags' : `# ${tag}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        {loadingTodos ? (
          <div className="spinner-container" style={{ padding: '60px 0' }}>
            <div className="spinner-ring"></div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Carregando suas tarefas...
            </p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            Nenhuma tarefa encontrada com os filtros selecionados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Renderizar tarefas pai (com suas respectivas subtarefas aninhadas) */}
            {parentTodos.map(todo => renderTodoCard(todo))}
            
            {/* Renderizar subtarefas órfãs na listagem */}
            {orphanSubtasks.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                  Subtarefas Isoladas
                </div>
                {orphanSubtasks.map(todo => renderTodoCard(todo, true))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Coluna Direita: Formulário de Adicionar / Editar Tarefa */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content', border: editingTodoId ? '2px solid var(--color-system)' : undefined }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginTop: 0 }}>
          {editingTodoId ? (
            <>
              <Edit2 size={18} style={{ color: 'var(--color-system)' }} />
              Editar Tarefa
            </>
          ) : (
            <>
              <PlusCircle size={18} style={{ color: 'var(--color-system)' }} />
              Nova Tarefa de Guilda
            </>
          )}
        </h3>
        
        <form onSubmit={onSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label>O que você vai fazer?</label>
            <input 
              type="text" 
              placeholder="ex: Pagar conta de internet da Anatel" 
              value={todoTitle}
              onChange={(e) => setTodoTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição / Observações (Opcional)</label>
            <textarea 
              rows="4"
              placeholder="Adicione detalhes, observações ou links úteis sobre essa tarefa..."
              value={todoDescription}
              onChange={(e) => setTodoDescription(e.target.value)}
              style={{ width: '100%', fontSize: '0.9rem', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', color: 'var(--text-color)' }}
            />
          </div>

          <div className="form-group">
            <label>Etiqueta / Contexto</label>
            <input 
              type="text" 
              placeholder="ex: Anatel, Casa, Mentoria, Aldrei" 
              value={todoLabel}
              onChange={(e) => setTodoLabel(e.target.value)}
              required
            />
            {/* Atalhos rápidos para etiquetas */}
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Etiquetas sugeridas:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quickLabels.map(ql => (
                  <button
                    key={ql}
                    type="button"
                    onClick={() => setTodoLabel(ql)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    className="hover-scale"
                  >
                    {ql}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Vincular a uma Tarefa Pai (Para criar Subtarefa)</label>
            <select value={todoParentId} onChange={(e) => setTodoParentId(e.target.value)}>
              <option value="">Nenhuma (Tarefa Principal)</option>
              {todos.filter(t => !t.parentId && !t.completed && t.id !== editingTodoId).map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Esfera RPG do Conhecimento</label>
            <select value={todoSphere} onChange={(e) => setTodoSphere(e.target.value)}>
              <option value="Profissional">💼 Profissional (Trabalho / Carreira)</option>
              <option value="Educacional">🎓 Educacional (Estudo / Cursos)</option>
              <option value="Pessoal">🟢 Pessoal (Organização / Rotina)</option>
              <option value="Físico">🏃‍♂️ Físico (Treinos / Alimentação)</option>
              <option value="Financeiro">💰 Financeiro (Contas / Investimentos)</option>
              <option value="Social">👥 Social (Amigos / Família / Lazer)</option>
            </select>
          </div>

          <div className="form-group">
            <label>XP de Recompensa</label>
            <select value={todoXp} onChange={(e) => setTodoXp(Number(e.target.value))}>
              <option value="5">5 XP (Tarefa muito rápida/fácil)</option>
              <option value="10">10 XP (Tarefa padrão)</option>
              <option value="15">15 XP (Tarefa média)</option>
              <option value="25">25 XP (Tarefa difícil/longa)</option>
              <option value="50">50 XP (Épica / Projeto concluído)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button 
              type="submit" 
              className="btn" 
              style={{ flex: 1, background: editingTodoId ? 'var(--color-system)' : 'var(--grad-system)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              disabled={addingTodo}
            >
              {editingTodoId ? 'Salvar Alterações' : 'Adicionar à Lista'}
            </button>
            {editingTodoId && (
              <button 
                type="button" 
                onClick={cancelEditMode}
                className="btn btn-secondary" 
                style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
