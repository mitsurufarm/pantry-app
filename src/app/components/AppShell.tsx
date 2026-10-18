import { useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { useAuth } from "../../shared/auth";
import { ErrorMessage, ResultDialog } from "../../shared/components";
import { NotificationPanel } from "../../features/notifications/NotificationPanel";
import { useExpiringStocks } from "../../features/notifications/useExpiringStocks";

interface AppShellProps {
  children: ReactNode;
  user: User;
  notice: string;
  onNotice: (message: string) => void;
}

export function AppShell({ children, user, notice, onNotice }: AppShellProps) {
  const location = useLocation();
  const stocks = useQuery({ queryKey: ["stocks"], queryFn: api.stocks });
  const [showNotifications, setShowNotifications] = useState(false);
  const [denied, setDenied] = useState(false);
  const { login, logout } = useAuth();

  const expiring = useExpiringStocks(stocks.data);

  useEffect(() => {
    const handler = () => {
      setDenied(true);
      void logout().catch(() => undefined);
    };
    window.addEventListener("pantry:access-denied", handler);
    return () => window.removeEventListener("pantry:access-denied", handler);
  }, [logout]);

  useEffect(() => {
    setShowNotifications(false);
    onNotice("");
  }, [location.pathname, onNotice]);

  if (denied) {
    return (
      <main className="center">
        <h1>このアカウントは利用できません</h1>
        <p>別のGoogleアカウントでログインしてください。</p>
        <button
          onClick={() => {
            setDenied(false);
            void (async () => {
              try {
                await logout();
                await login("/");
              } catch (error: unknown) {
                onNotice(String(error));
              }
            })();
          }}
        >
          別アカウントでログイン
        </button>
        <ErrorMessage error={notice} />
      </main>
    );
  }

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          Pantry
        </Link>
        <span className="account">{user.displayName ?? user.email}</span>
        <Link className="assistant-link" to="/assistant">
          AIに相談
        </Link>
        <button
          className="notification-button"
          aria-label="通知"
          aria-expanded={showNotifications}
          onClick={() => setShowNotifications((value) => !value)}
        >
          通知
          {expiring.length > 0 && (
            <span className="badge">{expiring.length}</span>
          )}
        </button>
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          stocks={stocks.data}
          isLoading={stocks.isPending}
          error={stocks.error}
        />
      </header>
      <main>
        {children}
        <ResultDialog message={notice} onClose={() => onNotice("")} />
      </main>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <Link to="/">献立</Link>
        <Link to="/stocks">在庫</Link>
        <Link to="/shopping-list">買い物</Link>
        <Link to="/more">その他</Link>
      </nav>
    </>
  );
}
