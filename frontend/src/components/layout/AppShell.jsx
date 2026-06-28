import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { initialsFor } from '../../utils/format';

const navItems = [
  { label: 'Dashboard', to: '/', marker: 'D' },
  { label: 'Customers', to: '/customers', marker: 'C' },
  { label: 'Purchases', to: '/purchases', marker: 'P' },
  { label: 'Reports', to: '/reports', marker: 'R' },
];

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-900/20">
        T
      </div>
      {!compact ? (
        <div>
          <p className="text-base font-bold text-slate-950">TanviCRM</p>
          <p className="text-xs font-medium text-slate-500">Customer intelligence</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({ onNavigate }) {
  return (
    <nav className="mt-8 space-y-1" aria-label="Primary">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
            isActive
              ? 'bg-teal-50 text-teal-800 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
          }`}
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700">
                  {item.marker}
                </span>
                {item.label}
              </span>
              {isActive ? <span className="h-2 w-2 rounded-full bg-teal-600" /> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function AppShell({ children, onLogout, user }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [scrollProgress, setScrollProgress] = useState(0);
  const profileName = user?.display_name || user?.email?.split('@')[0] || 'User';
  const profileRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Owner';
  const profileInitials = initialsFor(profileName || user?.email);

  const notifications = useMemo(() => [
    { title: 'Pending revenue review', detail: 'Follow up on open payment records today.' },
    { title: 'Customer data refreshed', detail: 'Dashboard metrics are synced with the API.' },
    { title: 'Weekly export ready', detail: 'CSV export is available from each data table.' },
  ], []);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const closeMenus = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="fixed left-0 top-0 z-50 h-1 bg-teal-500 transition-all" style={{ width: `${scrollProgress}%` }} />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white/95 px-5 py-6 shadow-sm backdrop-blur lg:block">
        <BrandMark />
        <SidebarNav />

        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Growth plan</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Track customers, purchases, and revenue in one workspace.</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full w-3/4 rounded-full bg-teal-500" />
          </div>
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="animate-fade-in relative h-full w-[min(20rem,86vw)] border-r border-slate-200 bg-white px-5 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                x
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 transition hover:border-teal-200 hover:text-teal-700 lg:hidden"
              >
                =
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Workspace</span>
                  <span>/</span>
                  <span className="text-teal-700">Dashboard</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">CRM Overview</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setProfileOpen(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  N
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                </button>
                {notificationsOpen ? (
                  <div className="animate-slide-up absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
                    <p className="px-2 pb-2 text-sm font-bold text-slate-950">Notifications</p>
                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <div key={item.title} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((current) => !current);
                    setNotificationsOpen(false);
                  }}
                  className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-200 sm:flex"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">{profileInitials}</span>
                  <span className="text-left leading-tight">
                    <span className="block max-w-36 truncate text-sm font-semibold text-slate-900">{profileName}</span>
                    <span className="block text-xs text-slate-500">{profileRole}</span>
                  </span>
                </button>
                {profileOpen ? (
                  <div className="animate-slide-up absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    <Link to="/" onClick={closeMenus} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Dashboard</Link>
                    <Link to="/customers" onClick={closeMenus} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Customer Records</Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:hidden"
              >
                Logout
              </button>
            </div>
          </div>
          {isOffline ? (
            <div role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-800">
              You are offline. Changes may fail until the connection returns.
            </div>
          ) : null}
        </header>

        <main id="dashboard" className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs font-medium text-slate-500 sm:px-6 lg:px-8">
          TanviCRM production workspace. Built for customer records, purchase tracking, and team-ready reporting.
        </footer>
      </div>
    </div>
  );
}

export default AppShell;
