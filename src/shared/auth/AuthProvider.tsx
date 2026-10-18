import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { auth, getRedirectResult, login, logout, popReturnPath } from "./index";
import { AuthContext } from "./context";
import type { AuthStatus } from "./types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }

    // Process redirect result if returning from signInWithRedirect
    void getRedirectResult(auth).catch(() => {
      // Redirect result errors will be handled via state
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If user changed or logged out, clear TanStack Query cache as per spec
      const currentUid = currentUser?.uid ?? null;
      if (
        previousUserIdRef.current &&
        previousUserIdRef.current !== currentUid
      ) {
        queryClient.clear();
      }
      previousUserIdRef.current = currentUid;

      setUser(currentUser);
      if (currentUser) {
        setStatus("authenticated");
        // Restore return path if saved before redirect
        const returnPath = popReturnPath();
        if (returnPath) {
          navigate(returnPath, { replace: true });
        }
      } else {
        setStatus("unauthenticated");
      }
    });

    return () => unsubscribe();
  }, [queryClient, navigate]);

  const value = useMemo(
    () => ({
      status,
      user,
      login: async (returnPath?: string) => {
        await login(returnPath);
      },
      logout: async () => {
        await logout();
        queryClient.clear();
        setStatus("unauthenticated");
        setUser(null);
      },
    }),
    [status, user, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
