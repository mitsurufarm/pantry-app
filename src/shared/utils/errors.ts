import { ApiError } from "../api";

export const errorMessages: Record<string, string> = {
  AUTH_REQUIRED: "ログイン状態を確認できません。もう一度ログインしてください。",
  ACCESS_DENIED:
    "このアカウントは利用できません。別のアカウントでログインしてください。",
  VALIDATION_ERROR: "入力内容を確認してください。",
  RESOURCE_NOT_FOUND: "対象のデータが見つかりません。画面を更新してください。",
  STATE_CONFLICT:
    "データが更新されています。画面を更新してからやり直してください。",
  RATE_LIMITED: "利用上限に達しました。時間をおいてから再度お試しください。",
  AI_INVALID_RESPONSE:
    "提案を処理できませんでした。条件を変えて再度お試しください。",
  AI_UNAVAILABLE:
    "AIを一時的に利用できません。時間をおいて再度お試しください。",
  AI_TIMEOUT: "AIの処理が時間内に完了しませんでした。再度お試しください。",
  INTERNAL_ERROR: "処理に失敗しました。時間をおいて再度お試しください。",
  REQUEST_TIMEOUT: "通信がタイムアウトしました。再度お試しください。",
  NETWORK_ERROR: "通信に失敗しました。ネットワークを確認してください。",
  INVALID_API_RESPONSE: "サーバーから正しいデータを受け取れませんでした。",
};

export function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    const base =
      errorMessages[error.code] ??
      "処理に失敗しました。時間をおいて再度お試しください。";
    return error.retryAfter
      ? `${base} 約${error.retryAfter}秒後に再試行できます。`
      : base;
  }
  if (error instanceof Error && error.message.includes("VITE_")) {
    return "API接続先が設定されていません。管理者にお問い合わせください。";
  }
  if (typeof error === "string") {
    return error;
  }
  return "処理に失敗しました。時間をおいて再度お試しください。";
}
