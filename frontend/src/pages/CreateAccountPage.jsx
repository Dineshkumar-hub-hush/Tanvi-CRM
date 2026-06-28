import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, clearStoredToken, getApiErrorMessage } from '../api/client';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score >= 4) return { label: 'Strong', width: '100%', color: 'bg-emerald-500' };
  if (score >= 2) return { label: 'Medium', width: '66%', color: 'bg-amber-500' };
  return { label: 'Weak', width: '33%', color: 'bg-rose-500' };
}

function CreateAccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDisplayName = displayName.trim();
  const normalizedPassword = password.trim();
  const normalizedConfirmPassword = confirmPassword.trim();
  const passwordStrength = useMemo(() => getPasswordStrength(normalizedPassword), [normalizedPassword]);
  const emailLooksValid = useMemo(() => /^\S+@\S+\.\S+$/.test(normalizedEmail), [normalizedEmail]);
  const passwordsMatch = normalizedPassword === normalizedConfirmPassword;
  const canSubmit = normalizedDisplayName.length >= 2 && emailLooksValid && normalizedPassword.length >= 6 && passwordsMatch && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!emailLooksValid) {
      setError('Enter a valid email address.');
      return;
    }

    if (normalizedDisplayName.length < 2) {
      setError('Enter your name.');
      return;
    }

    if (normalizedPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        display_name: normalizedDisplayName,
        email: normalizedEmail,
        password: normalizedPassword,
      });

      localStorage.setItem('rememberedEmail', normalizedEmail);
      clearStoredToken();
      navigate('/login', {
        replace: true,
        state: {
          email: normalizedEmail,
          message: 'Account created. Sign in with your new credentials.',
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Account creation failed. Please check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-[0.9fr_1fr]">
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white lg:hidden">T</div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Create account</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Start using TanviCRM</h1>
            <p className="mt-2 text-sm text-slate-500">Create secure credentials for your CRM workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="create-name">Name</label>
              <input
                id="create-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Your name"
                aria-invalid={displayName.length > 0 && normalizedDisplayName.length < 2}
              />
              {displayName.length > 0 && normalizedDisplayName.length < 2 ? <p className="mt-1 text-xs font-medium text-rose-600">Name must be at least 2 characters.</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="create-email">Email</label>
              <input
                id="create-email"
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="you@company.com"
                aria-invalid={email.length > 0 && !emailLooksValid}
              />
              {email.length > 0 && !emailLooksValid ? <p className="mt-1 text-xs font-medium text-rose-600">Use a valid email format.</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="create-password">Password</label>
              <div className="relative mt-1">
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={72}
                  value={password}
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-20 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Create a password"
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
              <div className="mt-2" aria-live="polite">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${passwordStrength.color}`} style={{ width: password ? passwordStrength.width : '0%' }} />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">Password strength: {password ? passwordStrength.label : 'Not started'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="create-confirm-password">Confirm Password</label>
              <input
                id="create-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                maxLength={72}
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Confirm your password"
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
              />
              {confirmPassword.length > 0 && !passwordsMatch ? <p className="mt-1 text-xs font-medium text-rose-600">Passwords must match.</p> : null}
            </div>

            <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
              Email verification is prepared as a product step and can be connected when SMTP is configured.
            </p>

            {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-800">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-xl font-bold shadow-lg shadow-indigo-500/30">T</div>
          <div>
            <p className="text-lg font-bold">TanviCRM</p>
            <p className="text-sm text-slate-300">Launch your CRM workspace</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-200">Modern CRM setup</p>
          <h2 className="mt-4 text-5xl font-bold tracking-tight">Start with clean data and confident workflows.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Your account opens directly into the dashboard so you can begin adding customers and recording purchase activity.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['Customers', 'Purchases', 'Analytics'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-semibold text-slate-100">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CreateAccountPage;
