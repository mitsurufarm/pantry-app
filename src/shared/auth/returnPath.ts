const RETURN_PATH_KEY = "pantry:return_path";

export function saveReturnPath(path: string): void {
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {
    // sessionStorage may be disabled or full
  }
}

export function popReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    if (path) {
      sessionStorage.removeItem(RETURN_PATH_KEY);
      return path;
    }
  } catch {
    // ignore
  }
  return null;
}
