import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="animate-slide-up w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-600">401 error</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Session expired</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your secure session could not be verified. Sign in again to continue managing the workspace.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Back to Sign In
        </Link>
      </section>
    </main>
  );
}

export default UnauthorizedPage;
