import React, { useEffect, useState } from 'react';
import { login, signup, getAuthConfig } from '../services/api';

const Login: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupAllowed, setSignupAllowed] = useState<boolean>(false);

  useEffect(() => {
    getAuthConfig().then(c => setSignupAllowed(c.signupAllowed)).catch(() => setSignupAllowed(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = mode === 'login'
        ? await login(username, password)
        : await signup(username, password);
      if (ok) onSuccess();
      else setError('Invalid credentials');
    } catch (e) {
      setError(mode === 'login' ? 'Login failed' : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bkg text-on-surface">
      <form onSubmit={onSubmit} className="bg-surface p-6 rounded-lg shadow w-80 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          {signupAllowed && (
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-sm text-primary"
            >
              {mode === 'login' ? 'Create account' : 'Have an account? Sign in'}
            </button>
          )}
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full p-2 rounded bg-bkg border border-surface" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full p-2 rounded bg-bkg border border-surface" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full p-2 rounded bg-primary text-on-primary disabled:opacity-50">
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign in' : 'Create account')}
        </button>
      </form>
    </div>
  );
};

export default Login;
