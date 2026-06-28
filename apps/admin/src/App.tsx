import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { useAuthStore } from "./store/authStore";
import { api } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ShopsPage from "./pages/ShopsPage";
import UsersPage from "./pages/UsersPage";
import LogsPage from "./pages/LogsPage";
import ManageShopPage from "./pages/ManageShopPage";
import OnboardedCodesPage from "./pages/OnboardedCodesPage";
import ManageAdminsPage from "./pages/ManageAdminsPage";
import toast from "react-hot-toast";

function RequireAdmin({ children, verifying }: { children: React.ReactNode; verifying: boolean }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isAdmin } = useAuthStore();

  if (!isLoaded || verifying) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e4ebf3", borderTopColor: "#111111", borderRadius: "50%" }} />
      </div>
    );
  }

  if (!isSignedIn || !isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { setIsAdmin } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        api.getStats()
          .then(() => {
            setIsAdmin(true);
            setVerifying(false);
          })
          .catch((err) => {
            console.error("Verification failed:", err);
            setIsAdmin(false);
            setVerifying(false);
            signOut().then(() => {
              toast.error("Access Denied. Your email is not registered as an Admin.");
              navigate("/auth/login");
            });
          });
      } else {
        setIsAdmin(false);
        setVerifying(false);
      }
    }
  }, [user, isLoaded, setIsAdmin, signOut, navigate]);

  return (
    <Routes>
      <Route path="/auth/login" element={<AuthPage />} />

      <Route element={<RequireAdmin verifying={verifying}><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/shops/:id/manage" element={<ManageShopPage />} />
        <Route path="/onboarded-codes" element={<OnboardedCodesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/admins" element={<ManageAdminsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Stub for AdminLayout to satisfy routing
import { AdminLayout } from "./components/AdminLayout";

