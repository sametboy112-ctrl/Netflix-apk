import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Logo } from '../components/Logo';

export function UserLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const eMail = email.trim().toLowerCase();
    const pName = name.trim();
    if (!eMail || !password.trim()) return setError('Email and password required.');
    if (isRegister && !pName) return setError('Name required.');
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (isRegister) {
        await register(eMail, password, pName);
        setSuccess('Account created! Check your email for confirmation link.');
      } else {
        await login(eMail, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    }
    setSubmitting(false);
  };

  const googleSignIn = () => {
    googleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#141414] dark:bg-[#141414] light:bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-white dark:text-white light:text-gray-900">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 mt-1">
            {isRegister ? 'Sign up to start streaming' : 'Sign in to continue'}
          </p>
        </div>

        <div className="bg-[#1a1a2e] dark:bg-[#1a1a2e] light:bg-white rounded-xl p-8 shadow-2xl border border-[#2a2a4a] dark:border-[#2a2a4a] light:border-gray-200">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-gray-100 border border-[#2a2a4a] dark:border-[#2a2a4a] light:border-gray-300 text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-red-500 transition"
                  placeholder="John Doe" />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-gray-100 border border-[#2a2a4a] dark:border-[#2a2a4a] light:border-gray-300 text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-red-500 transition"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-gray-100 border border-[#2a2a4a] dark:border-[#2a2a4a] light:border-gray-300 text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-red-500 transition"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50">
              {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2a2a4a]"></div></div>
            <div className="relative flex justify-center"><span className="px-3 text-sm text-gray-500 bg-[#1a1a2e]">or</span></div>
          </div>

          <button onClick={googleSignIn}
            className="w-full py-3 rounded-lg border border-[#2a2a4a] dark:border-[#2a2a4a] light:border-gray-300 text-white dark:text-white light:text-gray-700 font-medium hover:bg-white/5 transition flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6a6 6 0 0 1 0-12 5.4 5.4 0 0 1 3.9 1.5l2.7-2.6A9.4 9.4 0 0 0 12 2.4a9.6 9.6 0 1 0 0 19.2c5.5 0 9.2-3.8 9.2-9.2 0-.6 0-1-.1-1.5H12Z"/><path fill="#34A853" d="M3.8 7.7l3.2 2.4A6 6 0 0 1 12 5.7c1.6 0 3 .6 4 1.6l2.6-2.6A9.5 9.5 0 0 0 3.8 7.7Z"/><path fill="#FBBC05" d="M12 21.6a9.4 9.4 0 0 0 6.5-2.4l-3-2.4c-.8.6-2 1-3.5 1A6 6 0 0 1 6.4 14l-3.1 2.4A9.6 9.6 0 0 0 12 21.6Z"/><path fill="#4285F4" d="M21.2 12.4c0-.6 0-1-.1-1.5H12v3.9h5.5a4.8 4.8 0 0 1-2.1 3.1l3 2.4c1.8-1.7 2.8-4.1 2.8-7.9Z"/></svg>
            Continue with Google
          </button>

          <p className="text-center mt-6 text-sm text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
              className="ml-1 text-red-500 hover:text-red-400 font-medium">
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
