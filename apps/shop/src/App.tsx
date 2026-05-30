import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/authStore";
import { DashboardLayout } from "./components/DashboardLayout";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ShopSetupPage from "./pages/ShopSetupPage";
import ServicesPage from "./pages/ServicesPage";
import StaffPage from "./pages/StaffPage";
import BookingsPage from "./pages/BookingsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore();
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (!session) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Routes>
      <Route path="/auth/login" element={<AuthPage />} />
      <Route path="/register" element={<ShopSetupPage />} />

      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shop/edit" element={<ShopSetupPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/reviews" element={<div className="text-gray-400 p-8">Reviews — coming soon</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
