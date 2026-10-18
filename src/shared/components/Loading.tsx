interface LoadingProps {
  label?: string;
}

export function Loading({ label = "読み込み中…" }: LoadingProps) {
  return (
    <p className="loading" role="status">
      {label}
    </p>
  );
}
