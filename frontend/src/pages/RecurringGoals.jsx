/**
 * Metas Recorrentes
 * 
 * Painel de configuração de tarefas de repetição contínua (estudos diários,
 * blocos de trabalho fixos, pausas de almoço) que serão encaixadas pela IA.
 */
import React, { useContext, useState, useEffect } from 'react';
import { Target, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const DAYS_MAP = [
  { val: '0', label: 'D' },
  { val: '1', label: 'S' },
  { val: '2', label: 'T' },
  { val: '3', label: 'Q' },
  { val: '4', label: 'Q' },
  { val: '5', label: 'S' },
  { val: '6', label: 'S' },
];

const formatFrequency = (freq) => {
  if (!freq || typeof freq !== 'string') return freq;
  if (!/^[0-6](,[0-6])*$/.test(freq)) return freq; 
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = freq.split(',');
  if (days.length === 7) return 'Todos os dias';
  if (days.length === 5 && !days.includes('0') && !days.includes('6')) return 'Dias úteis';
  if (days.length === 2 && days.includes('0') && days.includes('6')) return 'Finais de semana';
  return days.map(d => names[Number(d)]).join(', ');
};

export default function RecurringGoals() {
  const {
    goals,
    goalTitle,
    setGoalTitle,
    goalDuration,
    setGoalDuration,
    goalSphere,
    setGoalSphere,
    goalFreq,
    setGoalFreq,
    editingGoal,
    setEditingGoal,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal
  } = useContext(AppContext);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} style={{ color: 'var(--color-system)' }} />
          Suas Metas Recorrentes
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Cadastre as atividades secundárias que deseja encaixar no seu dia. A inteligência artificial irá gerenciar e intercalar essas metas automaticamente nos blocos de menor demanda (como horários CLT de baixa demanda).
        </p>

        {goals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            Nenhuma meta cadastrada ainda. Adicione uma meta ao lado!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.map(goal => (
              <div 
                key={goal.id} 
                className="glass-panel" 
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: editingGoal?.id === goal.id ? '1px solid var(--color-system)' : '1px solid var(--border-color)',
                  boxShadow: editingGoal?.id === goal.id ? '0 0 8px rgba(33, 150, 243, 0.3)' : 'none'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '600' }}>{goal.title}</h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span className="sphere-tag" style={{
                      background: 
                        goal.sphere === 'Profissional' ? 'hsla(158, 82%, 46%, 0.15)' :
                        goal.sphere === 'Educacional' ? 'hsla(263, 90%, 68%, 0.15)' :
                        goal.sphere === 'Pessoal' ? 'hsla(35, 92%, 58%, 0.15)' :
                        goal.sphere === 'Físico' ? 'hsla(340, 90%, 60%, 0.15)' :
                        goal.sphere === 'Financeiro' ? 'hsla(85, 85%, 50%, 0.15)' :
                        goal.sphere === 'Social' ? 'hsla(195, 90%, 50%, 0.15)' : 'hsla(210, 90%, 55%, 0.15)',
                      color: 
                        goal.sphere === 'Profissional' ? 'var(--color-professional)' :
                        goal.sphere === 'Educacional' ? 'var(--color-educational)' :
                        goal.sphere === 'Pessoal' ? 'var(--color-personal)' :
                        goal.sphere === 'Físico' ? 'var(--color-physical)' :
                        goal.sphere === 'Financeiro' ? 'var(--color-financial)' :
                        goal.sphere === 'Social' ? 'var(--color-social)' : 'var(--color-system)'
                    }}>
                      {goal.sphere}
                    </span>
                    <span>⏱️ Duração: {goal.durationMins} mins</span>
                    <span>📅 Frequência: {formatFrequency(goal.frequency)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      setEditingGoal(goal);
                      setGoalTitle(goal.title);
                      setGoalDuration(goal.durationMins);
                      setGoalSphere(goal.sphere);
                      setGoalFreq(goal.frequency);
                    }}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', color: 'var(--color-system)', borderColor: 'hsla(210, 90%, 55%, 0.3)' }}
                    title="Editar Meta"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', color: '#ff4d4d', borderColor: 'hsla(0, 80%, 40%, 0.3)' }}
                    title="Excluir Meta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {editingGoal ? (
            <>
              <Edit2 size={18} style={{ color: 'var(--color-system)' }} />
              Editar Meta
            </>
          ) : (
            <>
              <PlusCircle size={18} style={{ color: 'var(--color-system)' }} />
              Nova Meta
            </>
          )}
        </h3>
        <form onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Título da Atividade</label>
            <input 
              type="text" 
              placeholder="ex: Ler livro de Clean Code / Ver videoaula" 
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Duração Sugerida (Minutos)</label>
            <select value={goalDuration} onChange={(e) => setGoalDuration(Number(e.target.value))}>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h 30m</option>
              <option value="120">2 horas</option>
              <option value="240">4 horas</option>
              <option value="480">8 horas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Esfera de Experiência</label>
            <select value={goalSphere} onChange={(e) => setGoalSphere(e.target.value)}>
              <option value="Profissional">💼 Profissional (Projetos / Trabalho)</option>
              <option value="Educacional">🎓 Educacional (Estudo / Cursos)</option>
              <option value="Pessoal">🟢 Pessoal (Leitura / Desenvolvimento)</option>
              <option value="Físico">🏃‍♂️ Físico (Treinos / Saúde)</option>
              <option value="Financeiro">💰 Financeiro (Investimentos / Orçamento)</option>
              <option value="Social">👥 Social (Hobbies / Lazer / Buffer)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dias da Semana</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
              {DAYS_MAP.map(day => {
                let selected = [];
                if (/^[0-6](,[0-6])*$/.test(goalFreq)) {
                  selected = goalFreq.split(',');
                } else {
                  if (goalFreq === 'Todos os dias') selected = ['0','1','2','3','4','5','6'];
                  else if (goalFreq === 'Somente dias úteis') selected = ['1','2','3','4','5'];
                  else if (goalFreq === 'Finais de semana') selected = ['0','6'];
                  else if (goalFreq === '3x por semana') selected = ['1','3','5'];
                  else if (goalFreq === '2x por semana') selected = ['2','4'];
                  else if (goalFreq === '1x por semana') selected = ['6'];
                }

                const isActive = selected.includes(day.val);

                const toggleDay = () => {
                  let newSel = [...selected];
                  if (newSel.includes(day.val)) {
                    newSel = newSel.filter(x => x !== day.val);
                  } else {
                    newSel.push(day.val);
                  }
                  newSel.sort();
                  if (newSel.length === 0) newSel = ['0','1','2','3','4','5','6']; 
                  setGoalFreq(newSel.join(','));
                };

                return (
                  <button
                    key={day.val}
                    type="button"
                    onClick={toggleDay}
                    style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      border: isActive ? 'none' : '1px solid var(--border-color)',
                      background: isActive ? 'var(--color-system)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="btn" style={{ flex: 1 }}>
              {editingGoal ? "Salvar Alterações" : "Cadastrar Meta"}
            </button>
            {editingGoal && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setEditingGoal(null);
                  setGoalTitle('');
                  setGoalDuration(30);
                  setGoalSphere('Profissional');
                  setGoalFreq('0,1,2,3,4,5,6');
                }}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
