import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  disableClose?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  disableClose = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElementRef.current =
        document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    if (disableClose) {
      e.preventDefault();
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={ariaLabel || title}
      onCancel={handleCancel}
      onClick={(e) => {
        // Backdrop click to close if not disabled
        if (e.target === dialogRef.current && !disableClose && onClose) {
          onClose();
        }
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </dialog>
  );
}
