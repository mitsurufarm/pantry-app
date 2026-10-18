interface ResultDialogProps {
  message: string;
  onClose: () => void;
}

export function ResultDialog({ message, onClose }: ResultDialogProps) {
  if (!message) return null;

  return (
    <div className="result-dialog" role="alertdialog" onClick={onClose}>
      <p>{message}</p>
      <button onClick={onClose}>閉じる</button>
    </div>
  );
}
