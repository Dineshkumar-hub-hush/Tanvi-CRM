function ServerErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="animate-slide-up w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
        <p className="text-sm font-bold uppercase tracking-wide text-rose-600">500 error</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Server unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The CRM API did not respond correctly. Check the backend service, then retry the dashboard.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Retry Dashboard
        </a>
      </section>
    </main>
  );
}

export default ServerErrorPage;
