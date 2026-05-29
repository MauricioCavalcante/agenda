import React, { useContext } from 'react';
import { Dumbbell, Sparkles, Shield, Info, CheckCircle2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function PhysicalSphere() {
  const {
    desiredExercisesInput,
    setDesiredExercisesInput,
    savingPhysicalSetup,
    handleSaveDesiredExercises,
    generatingPhysicalPlan,
    handleGeneratePhysicalPlan,
    aiPlanJson,
    editingPhysicalPlanText,
    setEditingPhysicalPlanText,
    physicalPlanText,
    setPhysicalPlanText,
    handleSavePhysicalPlanText,
    handleUpdateExerciseExecution
  } = useContext(AppContext);

  return (
    <div className="physical-setup-grid">
      {/* Left Column: Exercises Preference Input & AI Generation */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Dumbbell size={20} style={{ color: 'var(--color-physical)' }} />
          Exercícios Desejados (Esfera Físico)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Descreva abaixo quais exercícios, esportes ou treinos você gostaria de realizar na sua rotina (ex: corrida de 5km, agachamento livre, flexões de braço, natação, etc.).
        </p>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="desiredExercises">Lista de Exercícios / Preferências</label>
          <textarea
            id="desiredExercises"
            rows="6"
            placeholder="ex: Flexões de braço, Barra Fixa, Agachamento, Abdominais. Gostaria também de correr aos sábados de manhã."
            value={desiredExercisesInput}
            onChange={(e) => setDesiredExercisesInput(e.target.value)}
            style={{ fontSize: '0.9rem', width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveDesiredExercises}
            disabled={savingPhysicalSetup}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', flex: 1, minWidth: '150px' }}
          >
            {savingPhysicalSetup ? "Salvando..." : "Salvar Exercícios"}
          </button>

          <button
            onClick={handleGeneratePhysicalPlan}
            disabled={generatingPhysicalPlan}
            className="btn"
            style={{ background: 'var(--grad-physical)', flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Sparkles size={16} />
            {generatingPhysicalPlan ? "Gerando Treino..." : "Gerar Plano com IA"}
          </button>
        </div>
      </div>

      {/* Right Column: AI Plan Display & Custom Edit */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Shield size={18} style={{ color: 'var(--color-physical)' }} />
            Seu Plano de Treino Atual
          </h3>
          {aiPlanJson && (
            <button
              onClick={() => setEditingPhysicalPlanText(!editingPhysicalPlanText)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {editingPhysicalPlanText ? "Visualizar Plano" : "Editar JSON"}
            </button>
          )}
        </div>

        {editingPhysicalPlanText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Ajuste a estrutura do seu plano no editor de texto JSON abaixo. Certifique-se de manter o formato válido.
            </p>
            <textarea
              rows="14"
              value={physicalPlanText}
              onChange={(e) => setPhysicalPlanText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingPhysicalPlanText(false);
                  setPhysicalPlanText(JSON.stringify(aiPlanJson, null, 2));
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhysicalPlanText}
                className="btn"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--grad-physical)' }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        ) : aiPlanJson ? (
          <div>
            {aiPlanJson.generalNotes && (
              <div className="physical-alert">
                <Info className="physical-alert-icon" size={18} />
                <div className="physical-alert-text">
                  <strong>Recomendações da IA:</strong> {aiPlanJson.generalNotes}
                </div>
              </div>
            )}

            <div className="workout-cards-container">
              {aiPlanJson.workouts && aiPlanJson.workouts.map((workout, wIdx) => (
                <div key={wIdx} className="glass-panel workout-card-premium" style={{ padding: '16px' }}>
                  <div className="workout-title-container">
                    <h4 className="workout-title">{workout.title}</h4>
                    <span className="workout-tag">Físico</span>
                  </div>
                  {workout.description && (
                    <p className="workout-description">{workout.description}</p>
                  )}

                  {workout.exercises && workout.exercises.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="exercise-list-table">
                        <thead>
                          <tr>
                            <th>Exercício</th>
                            <th style={{ width: '80px' }}>Séries</th>
                            <th style={{ width: '100px' }}>Reps/Tempo</th>
                            <th style={{ width: '150px' }}>Execuções</th>
                            <th>Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workout.exercises.map((ex, exIdx) => {
                            const targetExecutions = parseInt(ex.targetExecutions, 10) || 10;
                            const doneExecutions = parseInt(ex.doneExecutions, 10) || 0;
                            const isCompleted = doneExecutions >= targetExecutions;
                            return (
                              <tr key={exIdx} className={`exercise-row ${isCompleted ? 'completed' : ''}`}>
                                <td className="exercise-name-col">
                                  {isCompleted && (
                                    <CheckCircle2 size={16} style={{ color: 'var(--color-professional)', flexShrink: 0 }} />
                                  )}
                                  <span>{ex.name}</span>
                                </td>
                                <td>{ex.sets || '-'}</td>
                                <td>{ex.reps || '-'}</td>
                                <td>
                                  <div className="execution-counter-wrapper">
                                    <button
                                      type="button"
                                      className="execution-btn btn-minus"
                                      onClick={() => handleUpdateExerciseExecution(wIdx, exIdx, 'doneExecutions', doneExecutions - 1)}
                                      disabled={doneExecutions <= 0}
                                      title="Decrementar execuções"
                                    >
                                      -
                                    </button>
                                    <span className="execution-done-text">{doneExecutions}</span>
                                    <span className="execution-divider">/</span>
                                    <input
                                      type="number"
                                      className="execution-target-input"
                                      value={targetExecutions}
                                      min="1"
                                      onChange={(e) => handleUpdateExerciseExecution(wIdx, exIdx, 'targetExecutions', parseInt(e.target.value, 10) || 1)}
                                      title="Editar quantidade máxima"
                                    />
                                    <button
                                      type="button"
                                      className="execution-btn btn-plus"
                                      onClick={() => handleUpdateExerciseExecution(wIdx, exIdx, 'doneExecutions', doneExecutions + 1)}
                                      disabled={doneExecutions >= targetExecutions}
                                      title="Incrementar execuções"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ex.notes || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <Dumbbell size={32} style={{ color: 'var(--border-highlight)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum plano de treino estruturado ainda.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Insira seus exercícios desejados ao lado e clique em "Gerar Plano com IA" para criar um treino completo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
