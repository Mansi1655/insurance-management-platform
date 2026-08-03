import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FolderDot, Lock, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleEmail, rolePassword) => {
    setError('');
    setSubmitting(true);
    try {
      await login(roleEmail, rolePassword);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative p-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        {/* Brand logo & header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FolderDot className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2">Welcome Back</h1>
          <p className="text-sm text-slate-400">Sign in to your Antigravity Insurance workspace</p>
        </div>

        {/* Login form card */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 text-rose-400 text-sm">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white gradient-btn shadow-lg mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick roles section */}
          <div className="border-t border-slate-800 pt-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3 text-center">
              Quick Role Switch
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('admin@antigravity.com', 'Admin123!')}
                className="py-2 px-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all text-center"
              >
                Administrator
              </button>
              <button
                onClick={() => handleQuickLogin('agent@antigravity.com', 'Agent123!')}
                className="py-2 px-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all text-center"
              >
                Insurance Agent
              </button>
              <button
                onClick={() => handleQuickLogin('customer@antigravity.com', 'Customer123!')}
                className="py-2 px-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all text-center"
              >
                Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
