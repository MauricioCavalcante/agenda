/**
 * Esfera Financeira
 * 
 * Visualização gamificada das finanças. Permite configurar renda,
 * metas de poupança e realizar missões de controle de gastos (Quests) sugeridas pela IA.
 */
import React, { useContext } from 'react';
import { Coins, Sparkles, Info, Award, RefreshCw } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function FinancialSphere() {
  const {
    monthlyIncomeInput,
    setMonthlyIncomeInput,
    savingsTargetInput,
    setSavingsTargetInput,
    financialGoalsInput,
    setFinancialGoalsInput,
    savingFinSetup,
    handleSaveFinancialSetup,
    generatingFinPlan,
    handleGenerateFinancialPlan,
    finPlanJson,
    editingFinPlanText,
    setEditingFinPlanText,
    finPlanText,
    setFinPlanText,
    handleSaveFinPlanText,
    handleUpdateQuestValue,
    handleClaimQuestXp
  } = useContext(AppContext);

  return (
    <div className="financial-setup-grid">
      {/* Left Column: Budget Configurator Panel */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={20} style={{ color: 'var(--color-financial)' }} />
          Configuração Financeira (RPG)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Defina sua renda, metas de aporte (poupança) e objetivos de riqueza. A Inteligência Artificial irá propor um plano de orçamentos e quests para você ganhar XP.
        </p>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="monthlyIncome">Renda Mensal (R$)</label>
          <input
            id="monthlyIncome"
            type="number"
            placeholder="ex: 3500"
            value={monthlyIncomeInput}
            onChange={(e) => setMonthlyIncomeInput(parseFloat(e.target.value) || 0)}
            style={{ fontSize: '0.9rem', width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="savingsTarget">Meta de Economia / Aporte (%)</label>
          <input
            id="savingsTarget"
            type="number"
            placeholder="ex: 20"
            min="0"
            max="100"
            value={savingsTargetInput}
            onChange={(e) => setSavingsTargetInput(parseFloat(e.target.value) || 0)}
            style={{ fontSize: '0.9rem', width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="financialGoals">Seus Objetivos / Diretrizes</label>
          <textarea
            id="financialGoals"
            rows="5"
            placeholder="ex: Gostaria de economizar para reserva de emergência e reduzir compras por impulso. Quero comprar um curso técnico em breve."
            value={financialGoalsInput}
            onChange={(e) => setFinancialGoalsInput(e.target.value)}
            style={{ fontSize: '0.9rem', width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveFinancialSetup}
            disabled={savingFinSetup}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {savingFinSetup && <RefreshCw size={14} className="animate-spin" />}
            {savingFinSetup ? "Salvando..." : "Salvar Dados"}
          </button>

          <button
            onClick={handleGenerateFinancialPlan}
            disabled={generatingFinPlan}
            className="btn"
            style={{ background: 'var(--grad-financial)', flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {generatingFinPlan ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {generatingFinPlan ? "Gerando Plano..." : "Gerar Orçamento RPG"}
          </button>
        </div>
      </div>

      {/* Right Column: AI Plan Display & Custom Edit */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Coins size={18} style={{ color: 'var(--color-financial)' }} />
            Seu Plano de Orçamento RPG
          </h3>
          {finPlanJson && (
            <button
              onClick={() => setEditingFinPlanText(!editingFinPlanText)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {editingFinPlanText ? "Visualizar Plano" : "Editar JSON"}
            </button>
          )}
        </div>

        {editingFinPlanText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Ajuste a estrutura do seu plano no editor de texto JSON abaixo. Certifique-se de manter o formato válido.
            </p>
            <textarea
              rows="14"
              value={finPlanText}
              onChange={(e) => setFinPlanText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingFinPlanText(false);
                  setFinPlanText(JSON.stringify(finPlanJson, null, 2));
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFinPlanText}
                className="btn"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--grad-financial)' }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        ) : finPlanJson ? (
          <div>
            {finPlanJson.generalNotes && (
              <div className="financial-alert" style={{ background: 'hsla(85, 85%, 50%, 0.05)', borderLeft: '4px solid var(--color-financial)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Info className="financial-alert-icon" size={18} style={{ color: 'var(--color-financial)', flexShrink: 0, marginTop: '2px' }} />
                <div className="financial-alert-text" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <strong>Conselho do Taverneiro Financeiro:</strong> {finPlanJson.generalNotes}
                </div>
              </div>
            )}

            {/* Suggested Budgets Categories */}
            {finPlanJson.suggestedBudgets && finPlanJson.suggestedBudgets.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Divisão de Alocação Recomendada
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {finPlanJson.suggestedBudgets.map((bud, bIdx) => (
                    <div key={bIdx} className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bud.category}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-financial)' }}>
                        R$ {bud.limit}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bud.percent}% da renda</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RPG Quests List */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quests Financeiras do Mês
            </h4>
            <div className="workout-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {finPlanJson.quests && finPlanJson.quests.map((quest, qIdx) => {
                const isLimitQuest = quest.type === 'expense';
                const isCompleted = isLimitQuest 
                  ? (quest.currentValue <= quest.targetValue) 
                  : (quest.currentValue >= quest.targetValue);
                const percent = Math.min(100, Math.floor((quest.currentValue / quest.targetValue) * 100));

                return (
                  <div key={quest.id || qIdx} className={`glass-panel quest-card-gold ${quest.claimed ? 'claimed' : ''}`} style={{ padding: '16px', position: 'relative', borderLeft: '4px solid var(--color-financial)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {quest.title}
                          {quest.claimed && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-professional)', background: 'hsla(158, 82%, 46%, 0.15)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              Resgatado
                            </span>
                          )}
                        </h5>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {quest.description}
                        </p>
                      </div>
                      <span className="xp-badge">
                        +{quest.xp || 20} XP
                      </span>
                    </div>

                    {/* Tracker control */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '12px', background: 'var(--bg-sub-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Meta: {isLimitQuest ? 'Não exceder' : 'Atingir'} <strong>R$ {quest.targetValue}</strong>
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="execution-btn btn-minus"
                          onClick={() => handleUpdateQuestValue(qIdx, 'currentValue', quest.currentValue - 50)}
                          disabled={quest.currentValue <= 0 || quest.claimed}
                          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          -
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>R$</span>
                          <input
                            type="number"
                            className="execution-target-input"
                            value={quest.currentValue}
                            min="0"
                            onChange={(e) => handleUpdateQuestValue(qIdx, 'currentValue', parseFloat(e.target.value) || 0)}
                            disabled={quest.claimed}
                            style={{ width: '80px', height: '28px', padding: '0 6px', fontSize: '0.85rem', textAlign: 'center' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="execution-btn btn-plus"
                          onClick={() => handleUpdateQuestValue(qIdx, 'currentValue', quest.currentValue + 50)}
                          disabled={quest.claimed}
                          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Status bar */}
                    <div style={{ marginTop: '12px' }}>
                      <div className="progress-bar-container" style={{ height: '4px' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${percent}%`, 
                            background: isLimitQuest 
                              ? (percent > 100 ? 'var(--color-physical)' : 'var(--color-financial)') 
                              : 'var(--color-financial)' 
                          }}
                        ></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Progresso: {percent}%</span>
                        <span style={{ color: isCompleted ? 'var(--color-professional)' : (isLimitQuest ? 'var(--text-muted)' : 'var(--color-physical)') }}>
                          {isCompleted ? '✓ Quest Cumprida!' : (isLimitQuest ? '⚠️ Limite Excedido!' : 'Quest em Progresso')}
                        </span>
                      </div>
                    </div>

                    {/* Claim Reward Button */}
                    {isCompleted && !quest.claimed && (
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleClaimQuestXp(quest.id, quest.title, quest.xp || 20)}
                          className="btn"
                          style={{ background: 'var(--grad-professional)', padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Award size={14} />
                          Resgatar XP (+{quest.xp || 20} XP)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <Coins size={32} style={{ color: 'var(--border-highlight)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum plano de orçamento estruturado ainda.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Insira seus dados financeiros ao lado e clique em "Gerar Orçamento RPG" para receber suas quests!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
