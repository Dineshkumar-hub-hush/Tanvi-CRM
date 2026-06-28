import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage } from '../api/client';

function LoginPage({ onAuth }) {
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(() => location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const normalizedEmail = email.trim().toLowerCase();
  const emailLooksValid = useMemo(() => /^\S+@\S+\.\S+$/.test(normalizedEmail), [normalizedEmail]);
  const canSubmit = emailLooksValid && password.trim().length >= 6 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const normalizedPassword = password.trim();

    if (!emailLooksValid) {
      setError('Enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.login({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (remember) {
        localStorage.setItem('rememberedEmail', normalizedEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      onAuth(response.data.access_token, remember, response.data.user);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-[1fr_0.9fr]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-xl font-bold shadow-lg shadow-indigo-500/30">T</div>
          <div>
            <p className="text-lg font-bold">TanviCRM</p>
            <p className="text-sm text-slate-300">Premium customer workspace</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-200">Welcome back</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight">A calmer way to manage customers and revenue.</h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Sign in to review customer segments, recent purchases, and commercial activity from one modern dashboard.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['Live insights', 'Secure access', 'Fast workflows'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-semibold text-slate-100">
              {item}
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white lg:hidden">T</div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Account sign in</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Access your CRM</h2>
            <p className="mt-2 text-sm text-slate-500">Use your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="you@company.com"
                aria-invalid={email.length > 0 && !emailLooksValid}
              />
              {email.length > 0 && !emailLooksValid ? <p className="mt-1 text-xs font-medium text-rose-600">Use a valid email format.</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-password">Password</label>
              <div className="relative mt-1">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-20 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setMessage('Password recovery is ready for SMTP integration. Contact your workspace owner for a reset.')}
                className="ml-auto font-bold text-teal-700 hover:text-teal-800"
              >
                Forgot password?
              </button>
            </div>

            {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to TanviCRM?{' '}
            <Link to="/create-account" className="font-bold text-indigo-700 hover:text-indigo-800">
              Create account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
