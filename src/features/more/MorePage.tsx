import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth";
import { messageFor } from "../../shared/utils/errors";
import { ConfirmDialog } from "../../shared/components";

interface MorePageProps {
  onNotice: (message: string) => void;
}

export function MorePage({ onNotice }: MorePageProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout()
      .then(() => navigate("/login"))
      .catch((error: unknown) => onNotice(messageFor(error)));
  };

  return (
    <section>
      <p className="eyebrow">アプリの設定</p>
      <h1>その他</h1>
      <Link className="card settings-link" to="/settings">
        <b>プロフィール設定</b>
        <span>家族構成・好み・要件を編集</span>
      </Link>
      <button className="danger" onClick={() => setShowLogoutConfirm(true)}>
        ログアウト
      </button>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="ログアウトの確認"
        message="ログアウトしますか？"
        confirmLabel="ログアウト"
        isDanger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </section>
  );
}
