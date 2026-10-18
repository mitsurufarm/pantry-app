import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="confirm-dialog-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="button-row">
          <button
            className={isDanger ? "danger" : ""}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
          <button className="secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
