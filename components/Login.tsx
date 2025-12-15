import React, { useState } from 'react';
import { Button } from './Button';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin?: (email: string) => void; // Optional now as Auth state is handled in App.tsx
}

export const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validateEmail = (email: string) => {
    // Regex estrito para validar formato de e-mail (ex: usuario@dominio.com)
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validação de formato de e-mail antes de enviar
    if (!validateEmail(email)) {
      setError('Por favor, insira um endereço de e-mail válido (ex: nome@dominio.com).');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail ou faça login se a confirmação não for necessária.');
        setIsSignUp(false); // Switch back to login
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Auth state change will be caught in App.tsx
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
    // Clear name fields when switching modes
    if (!isSignUp) {
      setFirstName('');
      setLastName('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-amber-500 mb-4 border border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">SmartNotes AI</h1>
          <p className="text-slate-400 text-sm mt-2">
            {isSignUp ? 'Crie sua conta gratuita' : 'Acesse suas anotações inteligentes'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                <input
                  id="firstName"
                  type="text"
                  required={isSignUp}
                  className="block w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors placeholder-slate-500"
                  placeholder="João"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">Sobrenome</label>
                <input
                  id="lastName"
                  type="text"
                  required={isSignUp}
                  className="block w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors placeholder-slate-500"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors placeholder-slate-500"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors placeholder-slate-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center animate-in fade-in slide-in-from-top-2">
               <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-900/30 border border-green-900/50 text-green-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
              {message}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-3 text-base justify-center shadow-md hover:shadow-lg transition-all"
            isLoading={isLoading}
          >
            {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button 
              onClick={toggleMode}
              className="font-medium text-amber-500 hover:text-amber-400 hover:underline focus:outline-none"
            >
              {isSignUp ? 'Faça Login' : 'Crie uma agora'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};