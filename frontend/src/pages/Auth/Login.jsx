import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppContext } from '../../context/AppContext';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  
  const { session, theme } = useContext(AppContext);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem. Verifique e tente novamente.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        setErrorMsg('Conta criada com sucesso! Você já pode acessar ou verificar seu email (caso configurado no Supabase).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // O onAuthStateChange no AppContext cuidará do redirecionamento
      }
    } catch (error) {
      setErrorMsg(error.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px', textAlign: 'center', borderRadius: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
            <Shield size={48} style={{ color: 'var(--color-system)' }} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>LevelUp Routine</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
          {isRegistering ? 'Crie sua conta para iniciar sua jornada.' : 'Faça login para acessar suas skills.'}
        </p>

        {errorMsg && (
          <div style={{ backgroundColor: 'hsla(0, 80%, 50%, 0.1)', border: '1px solid hsla(0, 80%, 50%, 0.3)', color: errorMsg.includes('sucesso') ? '#51cf66' : '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'left' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {isRegistering && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <UserPlus size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Seu nome" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '8px', background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Confirme sua Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}
            disabled={loading}
          >
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não é um aventureiro?'}
          </span>
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-system)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer', padding: 0 }}
          >
            {isRegistering ? 'Faça login' : 'Cadastre-se'}
          </button>
        </div>

      </div>
    </div>
  );
}
