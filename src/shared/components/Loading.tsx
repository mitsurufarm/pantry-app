interface LoadingProps {
  label?: string;
  overlay?: boolean;
}

export function Loading({
  label = "読み込み中…",
  overlay = false,
}: LoadingProps) {
  if (overlay) {
    return (
      <div className="loading-overlay" role="status" aria-live="polite">
        <div className="loading-box">
          <span className="spinner" aria-hidden="true" />
          <p className="loading">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <p className="loading" role="status" aria-live="polite">
      <span className="spinner spinner-inline" aria-hidden="true" />
      {label}
    </p>
  );
}
