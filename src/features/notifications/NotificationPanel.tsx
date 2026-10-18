import { useNavigate } from "react-router-dom";
import type { Stock } from "../../shared/api";
import { ErrorMessage, Loading } from "../../shared/components";
import { useExpiringStocks } from "./useExpiringStocks";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export function NotificationPanel({
  isOpen,
  onClose,
  stocks,
  isLoading,
  error,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const expiring = useExpiringStocks(stocks);

  if (!isOpen) return null;

  return (
    <div className="notification-panel" role="dialog" aria-label="期限通知">
      <div className="panel-heading">
        <b>賞味期限のお知らせ</b>
        <button className="text-button" onClick={onClose}>
          閉じる
        </button>
      </div>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : expiring.length > 0 ? (
        <ul>
          {expiring.map((stock) => (
            <li key={stock.stock_id}>
              <button
                className="notification-item"
                onClick={() => {
                  onClose();
                  navigate("/stocks");
                }}
              >
                {stock.display_name}（明日期限）
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>明日が賞味期限の食材はありません。</p>
      )}
    </div>
  );
}
