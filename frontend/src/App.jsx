import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import { ToastProvider } from './components/ui/ToastProvider';
import { authApi, clearStoredToken, getStoredToken, getStoredUser, storeAuthSession } from './api/client';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const CreateAccountPage = lazy(() => import('./pages/CreateAccountPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getStoredToken()));

  const handleAuth = (accessToken, remember = true, profile = null) => {
    storeAuthSession(accessToken, profile, remember);
    setToken(accessToken);
    setUser(profile);
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleExpiredSession = () => {
      clearStoredToken();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpiredSession);
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, []);

  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      return;
    }

    let active = true;
    setCheckingSession(true);
    authApi.me()
      .then((response) => {
        if (!active) return;
        const profile = response.data;
        setUser(profile);
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(profile));
      })
      .catch(() => {
        if (!active) return;
        clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (checkingSession) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/" replace /> : <LoginPage onAuth={handleAuth} />}
            />
            <Route
              path="/create-account"
              element={token ? <Navigate to="/" replace /> : <CreateAccountPage />}
            />
            <Route path="/signup" element={<Navigate to="/create-account" replace />} />
            <Route path="/register" element={<Navigate to="/create-account" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/server-error" element={<ServerErrorPage />} />
            <Route
              path="/"
              element={token ? <DashboardPage activeView="dashboard" onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/customers"
              element={token ? <DashboardPage activeView="customers" onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/purchases"
              element={token ? <DashboardPage activeView="purchases" onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/reports"
              element={token ? <DashboardPage activeView="reports" onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
