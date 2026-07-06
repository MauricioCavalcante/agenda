/**
 * Configuração da Inteligência Artificial
 * 
 * Painel administrativo para definir provedores (OpenAI, Gemini, Ollama),
 * chave de acesso (API Key) e modelo padrão para as gerações textuais.
 */
import React, { useContext, useState, useEffect } from 'react';
import { Brain, Key } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function AIConfig() {
  const {
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    aiEndpoint,
    setAiEndpoint,
    aiApiKey,
    setAiApiKey,
    handleSaveAiConfig,
    isSavingAiConfig
  } = useContext(AppContext);

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '650px', margin: '0 auto' }}>
      <h2>
        <Brain size={22} style={{ color: 'var(--color-system)', marginRight: '8px', verticalAlign: 'middle' }} />
        Configuração de Inteligência Artificial
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', marginTop: '6px' }}>
        Configure o modelo de LLM que será consumido para organizar suas tarefas. Você pode utilizar chaves de provedores de nuvem ou apontar para um modelo local (como o Ollama).
      </p>

      <form onSubmit={handleSaveAiConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Provedor de IA</label>
          <select value={aiProvider} onChange={(e) => {
            setAiProvider(e.target.value);
            if (e.target.value === 'openai') {
              setAiModel('gpt-4o-mini');
              setAiEndpoint('https://api.openai.com/v1');
            } else if (e.target.value === 'gemini') {
              setAiModel('gemini-1.5-flash');
              setAiEndpoint('');
            } else if (e.target.value === 'anthropic') {
              setAiModel('claude-3-5-sonnet-20240620');
              setAiEndpoint('');
            } else {
              setAiModel('llama3');
              setAiEndpoint('http://localhost:11434');
            }
          }}>
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="ollama">Ollama (Servidor Local)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Modelo (Model ID)</label>
          <input 
            type="text" 
            value={aiModel} 
            onChange={(e) => setAiModel(e.target.value)} 
            required 
          />
        </div>

        {aiProvider !== 'ollama' && (
          <div className="form-group">
            <label>Chave de API (API Key)</label>
            <input 
              type="password" 
              value={aiApiKey} 
              placeholder={aiApiKey === '*****' ? 'Chave de API salva' : 'Cole sua chave de API aqui'}
              onChange={(e) => setAiApiKey(e.target.value)} 
              required={!aiApiKey} 
            />
          </div>
        )}

        {(aiProvider === 'openai' || aiProvider === 'ollama') && (
          <div className="form-group">
            <label>Base URL do Endpoint</label>
            <input 
              type="text" 
              value={aiEndpoint} 
              onChange={(e) => setAiEndpoint(e.target.value)} 
              placeholder="ex: https://api.openai.com/v1 ou http://localhost:11434"
              required
            />
          </div>
        )}

        <button type="submit" className="btn" style={{ alignSelf: 'flex-start', marginTop: '12px' }} disabled={isSavingAiConfig}>
          {isSavingAiConfig ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
              Salvando...
            </span>
          ) : (
            <>
              <Key size={16} />
              Salvar Configurações
            </>
          )}
        </button>
      </form>
    </div>
  );
}
