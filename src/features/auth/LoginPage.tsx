import { useState } from "react";
import { useLocation } from "react-router-dom";
import { firebaseConfigured, useAuth } from "../../shared/auth";
import { ErrorMessage } from "../../shared/components";

export function LoginPage() {
  const [error, setError] = useState<unknown>(null);
  const { login } = useAuth();
  const location = useLocation();

  // If redirected from a protected route, state?.from contains the intended pathname
  const fromPath = (location.state as { from?: string } | undefined)?.from;

  return (
    <main className="login center">
      <h1>食材・献立サポート</h1>
      <p>家族の食材と毎日の献立をまとめて管理します。</p>
      {!firebaseConfigured && (
        <p className="error">
          Firebaseの設定がありません。管理者にお問い合わせください。
        </p>
      )}
      <button
        disabled={!firebaseConfigured}
        onClick={() => {
          setError(null);
          void login(fromPath).catch(setError);
        }}
      >
        Googleでログイン
      </button>
      <ErrorMessage error={error} />
    </main>
  );
}
