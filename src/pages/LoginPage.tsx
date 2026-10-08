import { useState } from 'react';
import { Clapperboard, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Page } from '@/components/Layout';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-white via-red-50/30 to-orange-50/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="login-icon inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 mb-4">
            <Clapperboard className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="login-title text-2xl font-bold text-neutral-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="login-subtitle mt-2 text-sm text-neutral-500">
            {mode === 'login'
              ? 'Sign in to like videos and personalize your experience'
              : 'Join ReelTube to like, share, and discover videos'}
          </p>
        </div>

        <div className="login-card bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xl shadow-neutral-200/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="login-field-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="login-field-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="login-error flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="login-submit w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="login-footer mt-5 pt-5 border-t border-neutral-200 text-center">
            <p className="text-sm text-neutral-500">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                className="text-red-600 font-semibold hover:underline transition-all"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="login-terms mt-6 text-center text-xs text-neutral-400">
          By continuing, you agree to ReelTube's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
