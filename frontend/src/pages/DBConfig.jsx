/**
 * Configuração de Banco de Dados Avançado
 * 
 * Permite ao usuário migrar da instância SQLite local (padrão) para uma
 * base de dados PostgreSQL remota, garantindo persistência na nuvem.
 */
import React, { useContext, useState, useEffect } from 'react';
import { Database, Key, Server, RefreshCw, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export default function DBConfig() {
  const {
    dbProvider,
    setDbProvider,
    dbConnectionString,
    setDbConnectionString,
    dbHost,
    setDbHost,
    dbPort,
    setDbPort,
    dbDatabase,
    setDbDatabase,
    dbUsername,
    setDbUsername,
    dbPassword,
    setDbPassword,
    dbSsl,
    setDbSsl,
    dbActive,
    testingDbConnection,
    activatingDb,
    handleTestDbConnection,
    handleActivateDbConnection,
    handleDeactivateDbConnection
  } = useContext(AppContext);

  const [inputMode, setInputMode] = useState('url'); // 'url' | 'fields'
  const [migrateData, setMigrateData] = useState(true);

  const handleTest = async (e) => {
    if (e) e.preventDefault();
    await handleTestDbConnection();
  };

  const handleActivate = async (e) => {
    if (e) e.preventDefault();
    if (dbProvider === 'sqlite') {
      alert("Por favor, selecione PostgreSQL / Supabase para ativar uma conexão remota.");
      return;
    }
    const confirmMsg = migrateData
      ? "Isso migrará todos os dados do SQLite local para o PostgreSQL remoto. O banco remoto será sobrescrito. Deseja continuar?"
      : "O banco de dados remoto será ativado. Nenhum dado local será migrado. Deseja continuar?";
    
    if (window.confirm(confirmMsg)) {
      await handleActivateDbConnection(migrateData);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm("Deseja realmente voltar para o SQLite local? Seus dados locais continuam guardados.")) {
      await handleDeactivateDbConnection();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', maxWidth: '650px', margin: '0 auto' }}>
      <h2>
        <Database size={22} style={{ color: 'var(--color-system)', marginRight: '8px', verticalAlign: 'middle' }} />
        Configuração do Banco de Dados
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', marginTop: '6px' }}>
        Conecte o LevelUp Routine ao seu próprio banco de dados na nuvem (como o Supabase ou qualquer PostgreSQL) para persistir e sincronizar seus dados remotamente.
      </p>

      {/* Connection Status Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderRadius: '10px',
        background: dbActive ? 'hsla(158, 80%, 40%, 0.1)' : 'hsla(210, 80%, 40%, 0.08)',
        border: dbActive ? '1px solid var(--color-professional)' : '1px solid var(--color-system)',
        marginBottom: '24px'
      }}>
        {dbActive ? (
          <CheckCircle size={24} style={{ color: 'var(--color-professional)' }} />
        ) : (
          <Server size={24} style={{ color: 'var(--color-system)' }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
            Status da Conexão: <span style={{ color: dbActive ? 'var(--color-professional)' : 'var(--color-system)' }}>
              {dbActive ? "Ativo (PostgreSQL / Supabase)" : "Local (SQLite)"}
            </span>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            {dbActive 
              ? "O aplicativo está rodando e gravando dados no seu PostgreSQL remoto." 
              : "Os dados estão sendo armazenados localmente na pasta 'data' no arquivo SQLite."}
          </p>
        </div>
        {dbActive && (
          <button 
            type="button" 
            onClick={handleDeactivate} 
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            disabled={activatingDb}
          >
            Voltar para SQLite
          </button>
        )}
      </div>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label>Provedor de Banco de Dados</label>
          <select value={dbProvider} onChange={(e) => setDbProvider(e.target.value)}>
            <option value="sqlite">SQLite Local (Padrão)</option>
            <option value="postgres">PostgreSQL / Supabase</option>
          </select>
        </div>

        {dbProvider === 'postgres' && (
          <>
            <div className="form-group">
              <label>Modo de Entrada</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="inputMode" 
                    value="url" 
                    checked={inputMode === 'url'} 
                    onChange={() => setInputMode('url')}
                    style={{ width: 'auto' }}
                  />
                  URL / String de Conexão
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="radio" 
                    name="inputMode" 
                    value="fields" 
                    checked={inputMode === 'fields'} 
                    onChange={() => setInputMode('fields')}
                    style={{ width: 'auto' }}
                  />
                  Campos Individuais
                </label>
              </div>
            </div>

            {inputMode === 'url' ? (
              <div className="form-group">
                <label>URL de Conexão (PostgreSQL Connection URI)</label>
                <input 
                  type="text" 
                  value={dbConnectionString} 
                  onChange={(e) => setDbConnectionString(e.target.value)} 
                  placeholder="ex: postgresql://postgres:[senha]@db.[id-projeto].supabase.co:5432/postgres"
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Host / Servidor</label>
                    <input 
                      type="text" 
                      value={dbHost} 
                      onChange={(e) => setDbHost(e.target.value)} 
                      placeholder="db.xxx.supabase.co"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Porta</label>
                    <input 
                      type="number" 
                      value={dbPort} 
                      onChange={(e) => setDbPort(e.target.value)} 
                      placeholder="5432"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do Banco de Dados</label>
                    <input 
                      type="text" 
                      value={dbDatabase} 
                      onChange={(e) => setDbDatabase(e.target.value)} 
                      placeholder="postgres"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Usuário</label>
                    <input 
                      type="text" 
                      value={dbUsername} 
                      onChange={(e) => setDbUsername(e.target.value)} 
                      placeholder="postgres"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Senha</label>
                  <input 
                    type="password" 
                    value={dbPassword} 
                    onChange={(e) => setDbPassword(e.target.value)} 
                    placeholder={dbPassword === '*****' ? 'Senha salva' : 'Sua senha do banco'}
                    required={dbPassword !== '*****'}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <input 
                type="checkbox" 
                id="sslCheck" 
                checked={dbSsl} 
                onChange={(e) => setDbSsl(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="sslCheck" style={{ cursor: 'pointer', fontWeight: '500' }}>
                Habilitar conexão segura (SSL/TLS recomendado)
              </label>
            </div>

            {/* Migration Option */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--bg-sub-card)',
              border: '1px solid var(--border-color)',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="migrateCheck" 
                  checked={migrateData} 
                  onChange={(e) => setMigrateData(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="migrateCheck" style={{ cursor: 'pointer', fontWeight: '600' }}>
                  Migrar dados do SQLite local ao ativar
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '22px' }}>
                Recomendado se você já tem tarefas, esferas configuradas e XP acumulado. Isso enviará seus registros para o banco externo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={handleTest} 
                className="btn btn-secondary"
                disabled={testingDbConnection || activatingDb}
                style={{ flex: 1 }}
              >
                {testingDbConnection ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Testar Conexão
              </button>
              <button 
                type="button" 
                onClick={handleActivate} 
                className="btn"
                disabled={testingDbConnection || activatingDb}
                style={{ flex: 1 }}
              >
                {activatingDb ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Salvar e Ativar Banco
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
