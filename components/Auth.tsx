
import React, { useState } from 'react';
import { Wallet, Mail, Lock, LogIn, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { signInWithGoogle, auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError({ message: err.message || 'Authentication failed', code: err.code });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError({
          code: err.code,
          message: `Domain Restricted: This preview domain (${window.location.hostname}) isn't whitelisted in your Firebase Console. Please add it to Authentication > Settings > Authorized Domains.`
        });
      } else {
        setError({ message: err.message || 'Google sign-in failed', code: err.code });
      }
    }
  };

  // Dispatch a custom event to enter Demo Mode, which App.tsx will catch
  const enterDemoMode = () => {
    window.dispatchEvent(new CustomEvent('enter-demo-mode'));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-500">
        <div className="p-10 pb-0 text-center">
          <div className="inline-flex p-4 bg-indigo-600 rounded-[1.5rem] mb-6 shadow-xl shadow-indigo-100">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight uppercase">Aapnaincom</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Personal Finance Ledger</p>
        </div>

        <div className="p-10">
          {error && (
            <div className={`mb-6 p-4 rounded-2xl flex gap-3 border animate-in slide-in-from-top-2 ${error.code === 'auth/unauthorized-domain' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
              {error.code === 'auth/unauthorized-domain' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error.code === 'auth/unauthorized-domain' ? 'Domain Error' : 'Auth Issue'}</p>
                <p className="text-xs font-medium leading-relaxed">{error.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-sm"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{isLogin ? 'Enter App' : 'Join Now'}</span>
                </>
              )}
            </button>
          </form>

          <div className="my-10 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white text-gray-400 font-black uppercase tracking-widest">Alternative</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleSignIn}
              className="flex-1 bg-white border border-gray-100 text-gray-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center space-x-3 shadow-sm active:scale-95"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              <span>Google</span>
            </button>
            <button
              onClick={enterDemoMode}
              className="flex-1 bg-emerald-50 border border-emerald-100 text-emerald-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Demo Mode</span>
            </button>
          </div>

          <p className="mt-10 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {isLogin ? "Need a ledger?" : "Have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
