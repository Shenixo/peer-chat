import { useRef, useState } from "react";
import { Download, TriangleAlert } from "lucide-react";
import { ActionButton } from "./arc/action-button/action-button";
import { formatFileSize } from "./arc/file-dropzone/file-dropzone";

export type IncomingRequestData = {
  id: string;
  fileName: string;
  /** Size in bytes. */
  size: number;
  fromName: string;
  /** Short suffix from the connection id, so duplicate names can be told apart. */
  fromSuffix: string;
};

type Props = {
  request: IncomingRequestData;
  /** Resolve when the peer has been told yes. Reject to show the error state. */
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  /** Called once the action has finished, so the parent can remove the card. */
  onResolved: (id: string) => void;
};

const RISKY = [".exe", ".msi", ".bat", ".cmd", ".scr", ".com", ".ps1", ".vbs", ".jar", ".apk"];

export function isRiskyFile(name: string) {
  const lower = name.toLowerCase();
  return RISKY.some((extension) => lower.endsWith(extension));
}

const AMBER = "#FF9F0A";
const QUIET = "#1B1B21";

export function IncomingRequest({ request, onAccept, onDecline, onResolved }: Props) {
  const risky = isRiskyFile(request.fileName);
  // Only one of the two buttons may run at a time.
  const busy = useRef(false);
  const [error, setError] = useState("");

  const run = (action: (id: string) => Promise<void>) => async () => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      await action(request.id);
      // Leave the success label on screen for a moment before the card goes.
      window.setTimeout(() => onResolved(request.id), 900);
    } catch (reason) {
      busy.current = false;
      setError(reason instanceof Error && reason.message ? reason.message : "Something went wrong. Try again.");
      throw reason; // lets ActionButton show its own error state
    }
  };

  return (
    <li className="list-none rounded-2xl border border-accent/50 bg-surface p-4">
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-elevated">
          {risky ? (
            <TriangleAlert size={20} strokeWidth={2} className="text-accent" aria-hidden="true" />
          ) : (
            <Download size={20} strokeWidth={1.8} className="text-ink" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[15px] font-semibold text-ink" title={request.fileName}>
            {request.fileName}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            From {request.fromName} <span className="font-mono">{request.fromSuffix}</span>
            {" · "}
            <span className="font-mono">{formatFileSize(request.size)}</span>
          </p>
          {risky && (
            <p className="mt-2 text-xs leading-relaxed text-accent">
              Programs can harm your computer. Only accept if you know and trust this person.
            </p>
          )}
          {error && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* For a risky file the emphasis flips, so Decline is the highlighted choice. */}
          <ActionButton
            label="Decline"
            pendingLabel="Declining"
            successLabel="Declined"
            onAction={run(onDecline)}
            background={risky ? AMBER : QUIET}
          />
          <ActionButton
            label="Accept"
            pendingLabel="Accepting"
            successLabel="Accepted"
            onAction={run(onAccept)}
            background={risky ? QUIET : AMBER}
          />
        </div>
      </div>
    </li>
  );
}