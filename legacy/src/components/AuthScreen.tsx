import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { User } from '../types';
import { INITIAL_USERS, getRoleLabel } from '../services/auth';
import { loginUserByEmail, setAuthSessionActive, setCurrentUser, ThemeMode } from '../services/storage';
import { isCloudConfigured, supabase } from '../services/supabase';
import { RhuaLogo } from './RhuaLogo';

interface Props { onLoginSuccess: (user: User) => void; theme?: ThemeMode; onToggleTheme?: (theme: ThemeMode) => void; }

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (isCloudConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError || !data.user) throw new Error('E-mail ou senha inválidos.');
        const { data: profile, error: profileError } = await supabase.from('profiles').select('name, role, avatar_url').eq('id', data.user.id).single();
        if (profileError || !profile) throw new Error('Perfil de acesso não configurado.');
        const user: User = { id: data.user.id, name: profile.name, email: data.user.email ?? email, role: profile.role, avatar: profile.avatar_url ?? undefined };
        setCurrentUser(user); setAuthSessionActive(true); onLoginSuccess(user); return;
      }
      const result = loginUserByEmail(email, password);
      if (!result.success || !result.user) throw new Error(result.message ?? 'Não foi possível entrar.');
      onLoginSuccess(result.user);
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.'); }
    finally { setLoading(false); }
  };

  const enterDemo = (user: User) => { setCurrentUser(user); setAuthSessionActive(true); onLoginSuccess(user); };

  return <main className="min-h-screen bg-[#050505] text-white grid grid-cols-1 lg:grid-cols-[1.08fr_.92fr] font-sans overflow-x-hidden">
    <section className="relative hidden lg:flex min-h-screen overflow-hidden border-r border-white/10 p-12 xl:p-16 flex-col justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(238,217,198,.14),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(238,217,198,.08),transparent_28%)]" />
      <div className="absolute -left-24 bottom-8 h-[34rem] w-[34rem] opacity-[.07]"><RhuaLogo variant="symbol" colorMode="sand" size="custom" width="100%" height="100%" /></div>
      <div className="relative flex items-center gap-4"><div className="h-14 w-14"><RhuaLogo variant="symbol" colorMode="sand" size="custom" width="100%" height="100%" /></div><div><p className="text-2xl font-semibold tracking-[.28em] text-[#EED9C6]">RHUA</p><p className="text-[10px] tracking-[.65em] text-[#EED9C6]/75">BAR</p></div></div>
      <div className="relative max-w-xl"><p className="mb-5 text-xs font-semibold uppercase tracking-[.34em] text-[#EED9C6]">Gestão financeira</p><h1 className="text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-tight">Clareza para decidir.<br /><span className="text-[#EED9C6]">Controle para crescer.</span></h1><p className="mt-7 max-w-lg text-base leading-7 text-white/55">Faturamento, despesas, vencimentos e relatórios em um único ambiente, com acessos definidos para cada função da equipe.</p></div>
      <p className="relative text-xs tracking-wider text-white/35">ADM RHUA • AMBIENTE DE ACESSO RESTRITO</p>
    </section>
    <section className="flex min-h-screen min-w-0 w-full items-center justify-center bg-[#EED9C6] px-5 py-10 text-black sm:px-10">
      <div className="min-w-0 w-full max-w-md">
        <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="h-11 w-11"><RhuaLogo variant="symbol" colorMode="black" size="custom" width="100%" height="100%" /></div><div><p className="font-bold tracking-[.25em]">RHUA</p><p className="text-[9px] tracking-[.55em]">BAR</p></div></div>
        <div className="mb-8"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-black text-[#EED9C6]"><LockKeyhole className="h-5 w-5" /></div><h2 className="text-3xl font-semibold tracking-tight">Bem-vindo de volta</h2><p className="mt-2 text-sm text-black/60">Entre com seu e-mail corporativo para continuar.</p></div>
        {!isCloudConfigured && <div className="mb-5 flex gap-3 rounded-xl border border-black/15 bg-white/30 p-3 text-xs leading-5 text-black/65"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Ambiente de demonstração. A nuvem será ativada após configurar as chaves do Supabase.</span></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider">E-mail</span><div className="relative"><UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" /><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@rhuabar.com.br" className="h-13 w-full rounded-xl border border-black/20 bg-white/55 pl-11 pr-4 text-sm outline-none focus:border-black" /></div></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider">Senha</span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className="h-13 w-full rounded-xl border border-black/20 bg-white/55 pl-11 pr-12 text-sm outline-none focus:border-black" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/45" aria-label="Mostrar ou ocultar senha">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
          {error && <p role="alert" className="rounded-xl bg-red-100/70 px-4 py-3 text-xs font-medium text-red-900">{error}</p>}
          <button disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-[#EED9C6] hover:bg-black/85 disabled:opacity-60"><span>{loading ? 'Validando acesso...' : 'Entrar no ADM RHUA'}</span><ArrowRight className="h-4 w-4" /></button>
        </form>
        {!isCloudConfigured && <div className="mt-6 border-t border-black/15 pt-5"><button type="button" onClick={() => setShowDemo((v) => !v)} className="text-xs font-semibold underline underline-offset-4">{showDemo ? 'Ocultar perfis de demonstração' : 'Apresentar níveis de acesso'}</button>{showDemo && <div className="mt-4 grid grid-cols-2 gap-2">{INITIAL_USERS.map((user) => <button key={user.id} type="button" onClick={() => enterDemo(user)} className="rounded-xl border border-black/15 bg-white/35 p-3 text-left hover:bg-white/65"><span className="block text-xs font-semibold">{getRoleLabel(user.role)}</span><span className="mt-1 block text-[10px] text-black/55">Entrar como {user.name.split(' ')[0]}</span></button>)}</div>}</div>}
        <p className="mt-9 text-center text-[10px] uppercase tracking-[.22em] text-black/45">Acesso protegido • RHUA Bar</p>
      </div>
    </section>
  </main>;
};
