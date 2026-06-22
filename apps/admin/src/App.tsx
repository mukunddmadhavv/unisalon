import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/authStore";
import { AdminLayout } from "./components/AdminLayout";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ShopsPage from "./pages/ShopsPage";
import UsersPage from "./pages/UsersPage";
import LogsPage from "./pages/LogsPage";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin } = useAuthStore();

  if (loading) {
    return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e4ebf3", borderTopColor: "#111111", borderRadius: "50%" }} />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { setSession, setIsAdmin } = useAuthStore();

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setIsAdmin(true); // Persisted or assumed true if session is valid; API will verify role
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsAdmin(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setIsAdmin]);

  return (
    <Routes>
      <Route path="/auth/login" element={<AuthPage />} />

      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
