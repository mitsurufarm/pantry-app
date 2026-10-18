export function todayJst(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

export function tomorrowJst(): string {
  const date = new Date(`${todayJst()}T12:00:00+09:00`);
  date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    date,
  );
}

export function weekStart(next = false): string {
  const date = new Date(`${todayJst()}T12:00:00+09:00`);
  date.setDate(date.getDate() - date.getDay() + (next ? 7 : 0));
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    date,
  );
}

export function undoSeconds(value?: string | null): number {
  if (!value) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(value).getTime() - Date.now()) / 1000),
  );
}

export function getExpirationState(
  expiration: string,
): "expired" | "soon" | "" {
  const days = Math.floor(
    (new Date(`${expiration}T12:00:00+09:00`).getTime() -
      new Date(`${todayJst()}T12:00:00+09:00`).getTime()) /
      86_400_000,
  );
  return days < 0 ? "expired" : days <= 3 ? "soon" : "";
}
