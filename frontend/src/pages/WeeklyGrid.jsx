import React from 'react';
import { Calendar, Info } from 'lucide-react';

export default function WeeklyGrid() {
  return (
    <div className="glass-panel weekly-schedule-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={22} style={{ color: 'var(--color-system)' }} />
        Grade Horária Padrão (Semanal)
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Esta é a estrutura base carregada a partir do seu arquivo <code style={{ background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>cronograma.txt</code>.
        O aplicativo sincroniza dinamicamente as tarefas de acordo com os dias específicos de leitura e exercícios físicos.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {/* Seg e Qui Column */}
        <div className="weekly-day-column">
          <h3 className="weekly-day-title">Segunda e Quinta-Feira</h3>
          <div className="weekly-tasks-flex">
            <div className="weekly-task-tag">
              <span className="time">09:00 - 10:00</span>
              <span>🚀 Projeto 1: IAPostLab</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">10:00 - 12:00</span>
              <span>💼 CLT (Hitss) - Manhã</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">12:00 - 13:30</span>
              <span>🍽️ Almoço e Descanso</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">13:30 - 17:30</span>
              <span>💼 CLT (Hitss) - Tarde</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">17:30 - 18:30</span>
              <span>🎓 Estudo: Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">18:30 - 19:30</span>
              <span>📜 Estudo: Pós-Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">19:30 - 20:30</span>
              <span>🛠️ Projeto 2</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(35, 92%, 58%, 0.3)' }}>
              <span className="time">20:30 - 21:00</span>
              <span>📚 Momento de Leitura</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(195, 90%, 50%, 0.3)' }}>
              <span className="time">21:00 em diante</span>
              <span>🟢 Livre / Buffer</span>
              <span className="sphere-tag">Social</span>
            </div>
          </div>
        </div>

        {/* Terça Column */}
        <div className="weekly-day-column">
          <h3 className="weekly-day-title">Terça-Feira (Mentoria)</h3>
          <div className="weekly-tasks-flex">
            <div className="weekly-task-tag">
              <span className="time">09:00 - 09:30</span>
              <span>🚀 Projeto 1: IAPostLab</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">09:30 - 11:30</span>
              <span>🧠 Mentoria</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">11:30 - 12:30</span>
              <span>💼 CLT (Hitss)</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">12:30 - 13:30</span>
              <span>🍽️ Almoço / Ajuste</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">13:30 - 18:30</span>
              <span>💼 CLT (Hitss) - Tarde</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">18:30 - 19:30</span>
              <span>🎓 Estudo: Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">19:30 - 20:30</span>
              <span>📜 Estudo: Pós-Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(35, 92%, 58%, 0.3)' }}>
              <span className="time">20:30 - 21:00</span>
              <span>📚 Momento de Leitura</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(195, 90%, 50%, 0.3)' }}>
              <span className="time">21:00 em diante</span>
              <span>🟢 Livre / Buffer</span>
              <span className="sphere-tag">Social</span>
            </div>
          </div>
        </div>

        {/* Qua e Sex Column */}
        <div className="weekly-day-column">
          <h3 className="weekly-day-title">Quarta e Sexta-Feira</h3>
          <div className="weekly-tasks-flex">
            <div className="weekly-task-tag">
              <span className="time">09:00 - 10:00</span>
              <span>🚀 Projeto 1: IAPostLab</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">10:00 - 12:00</span>
              <span>💼 CLT (Hitss) - Manhã</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">12:00 - 13:30</span>
              <span>🍽️ Almoço e Descanso</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">13:30 - 17:30</span>
              <span>💼 CLT (Hitss) - Tarde</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">17:30 - 18:30</span>
              <span>🎓 Estudo: Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">18:30 - 19:30</span>
              <span>📜 Estudo: Pós-Graduação</span>
              <span className="sphere-tag">Educacional</span>
            </div>
            <div className="weekly-task-tag">
              <span className="time">19:30 - 20:30</span>
              <span>🛠️ Projeto 3</span>
              <span className="sphere-tag">Profissional</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(340, 90%, 60%, 0.3)' }}>
              <span className="time">20:30 - 21:30</span>
              <span>🏋️ Exercícios Físicos</span>
              <span className="sphere-tag">Físico</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(195, 90%, 50%, 0.3)' }}>
              <span className="time">21:30 em diante</span>
              <span>🟢 Livre / Buffer</span>
              <span className="sphere-tag">Social</span>
            </div>
          </div>
        </div>

        {/* Sábado Column */}
        <div className="weekly-day-column">
          <h3 className="weekly-day-title">Sábado</h3>
          <div className="weekly-tasks-flex">
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(340, 90%, 60%, 0.3)' }}>
              <span className="time">09:00 - 10:30</span>
              <span>🏋️ Exercícios Físicos</span>
              <span className="sphere-tag">Físico</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(35, 92%, 58%, 0.3)' }}>
              <span className="time">10:30 - 11:30</span>
              <span>📚 Momento de Leitura</span>
              <span className="sphere-tag">Pessoal</span>
            </div>
            <div className="weekly-task-tag" style={{ border: '1px solid hsla(195, 90%, 50%, 0.3)' }}>
              <span className="time">11:30 em diante</span>
              <span>🟢 Fim de Semana Livre</span>
              <span className="sphere-tag">Social</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '30px', padding: '16px', display: 'flex', gap: '12px', background: 'hsla(210, 90%, 55%, 0.05)', border: '1px solid hsla(210, 90%, 55%, 0.2)' }}>
        <Info size={20} style={{ color: 'var(--color-system)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Reorganização Estratégica:</strong> Inclui treinos regulares (3x/semana, Quarta/Sexta fim de noite e Sábado de manhã) e momentos de leitura diários nos dias sem treino (Seg/Ter/Qui de noite e Sábado). Mantém o domingo 100% livre.
        </div>
      </div>
    </div>
  );
}
