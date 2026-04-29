import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); }
    catch (err: any) { setError(err.response?.data?.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{background:'var(--paper)'}}>
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col items-center justify-center w-2/5 p-12" style={{background:'var(--sidebar)'}}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6" style={{background:'var(--green)'}}>
          <BookOpen size={30} className="text-white"/>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">StudSave</h1>
        <p className="text-center text-sm" style={{color:'rgba(255,255,255,0.45)',maxWidth:'18rem'}}>
          Your personal study workspace. Organise notes, code and images — all in one place.
        </p>
        <div className="mt-10 space-y-3 w-64">
          {['Academic hierarchy','Code & text blocks','Image uploads','Progress tracking'].map(f=>(
            <div key={f} className="flex items-center gap-3 text-sm" style={{color:'rgba(255,255,255,0.55)'}}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'var(--green-md)'}}/>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:'var(--sidebar)'}}>
              <BookOpen size={20} className="text-white"/>
            </div>
            <div>
              <div className="font-bold text-lg" style={{color:'var(--ink)'}}>StudSave</div>
              <div className="text-xs" style={{color:'var(--ink3)'}}>Study Smart</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{color:'var(--ink)'}}>Welcome back</h1>
          <p className="text-sm mb-7" style={{color:'var(--ink3)'}}>Sign in to your study workspace</p>

          {error&&(
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
              style={{background:'var(--red-lt)',color:'var(--red)',border:'1.5px solid #fca5a5'}}>
              <AlertCircle size={15}/>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--ink3)'}}/>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  className="input pl-9" placeholder="you@example.com"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'var(--ink3)'}}>Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--ink3)'}}/>
                <input type={showPass?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)}
                  className="input pl-9 pr-10" placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{color:'var(--ink3)'}}>
                  {showPass?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading?<Loader2 size={16} className="animate-spin"/>:null}
              {loading?'Signing in…':'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full" style={{borderTop:'1.5px solid var(--border)'}}/></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs" style={{background:'var(--paper)',color:'var(--ink3)'}}>or</span></div>
          </div>

          <button onClick={()=>{ window.location.href='/api/auth/google'; }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-semibold transition-all btn-ghost justify-center">
            <svg width="15" height="15" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm mt-6" style={{color:'var(--ink3)'}}>
            No account?{' '}
            <Link to="/register" className="font-bold transition-colors hover:underline" style={{color:'var(--green)'}}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
