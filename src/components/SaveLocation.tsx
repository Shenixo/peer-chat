import { useState } from "react";
import { Folder } from "lucide-react";

type Props = {
  /** What is shown as the current save location. */
  path: string;
  /** Opens a folder chooser. Resolve to the chosen folder, or null if cancelled. */
  onPick: () => Promise<string | null>;
  onChange: (path: string) => void;
};

export function SaveLocation({ path, onPick, onChange }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const choose = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const chosen = await onPick();
      if (chosen) onChange(chosen);
    } catch (reason) {
      setError(reason instanceof Error && reason.message ? reason.message : "Couldn't open the folder chooser.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <Folder size={20} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-muted" />
        <p className="min-w-0 flex-1 truncate text-left text-xs text-muted">
          Saved to{" "}
          <span className="font-mono text-ink" title={path}>
            {path}
          </span>
        </p>
        <button
          type="button"
          onClick={choose}
          disabled={pending}
          className="min-h-11 shrink-0 rounded-full border border-line bg-elevated px-4 text-sm font-medium text-ink transition-colors hover:bg-elevated/70 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {pending ? "Choosing..." : "Change folder"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-left text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}