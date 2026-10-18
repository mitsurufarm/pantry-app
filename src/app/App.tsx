import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../shared/auth";
import { Loading } from "../shared/components";
import { LoginPage } from "../features/auth/LoginPage";
import { AppShell } from "./components/AppShell";
import { AppRoutes } from "./routes/AppRoutes";

function AuthenticatedApp({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/stocks") {
      void queryClient.invalidateQueries({ queryKey: ["stocks"] });
    }
  }, [location.pathname, queryClient]);

  return (
    <AppShell user={user} notice={notice} onNotice={setNotice}>
      <AppRoutes onNotice={setNotice} />
    </AppShell>
  );
}

function AppContent() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          }
        />
      </Routes>
    );
  }

  return <AuthenticatedApp user={user} />;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
