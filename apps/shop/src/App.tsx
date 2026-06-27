import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";
import { api } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ShopSetupPage from "./pages/ShopSetupPage";
import ServicesPage from "./pages/ServicesPage";
import StaffPage from "./pages/StaffPage";
import BookingsPage from "./pages/BookingsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e4ebf3", borderTopColor: "#111111", borderRadius: "50%" }} />
    </div>
  );
  if (!isSignedIn) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const name = user.fullName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "Owner";
      const phone = user.primaryPhoneNumber?.phoneNumber || "0000000000";
      // Automatically sync/register shop owner record in public database
      api.registerOwner({ name, phone })
        .catch((err) => console.error("Auto-registration error:", err));
    }
  }, [user, isLoaded]);

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

// Stub for DashboardLayout to satisfy routing, since it's imported dynamically or defined elsewhere
import { DashboardLayout } from "./components/DashboardLayout";

