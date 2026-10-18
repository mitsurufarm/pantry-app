import { messageFor } from "../utils/errors";

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p className="error" role="alert">
      {messageFor(error)}
    </p>
  );
}
