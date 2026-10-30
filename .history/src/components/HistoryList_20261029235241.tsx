import { useState } from "react";
import { CircleAlert, Download, Upload } from "lucide-react";
import { formatFileSize } from "./arc/file-dropzone/file-dropzone";

export type HistoryItem = {
  id: string;
  direction: "received" | "sent";
  fileName: string;
  /** Size in bytes. */
  size: number;
  /** Who it came from or went to, for example "Maya" or "everyone". */
  peerName: string;
  /** Short suffix from the connection id, or a detail like "3 peers". */
  peerDetail?: string;
  status: "receiving" | "done" | "stopped";
  /** 0 to 100. Used while receiving, and to show where a stopped transfer ended. */
  progress?: number;
  /** When it finished or stopped, as a timestamp in milliseconds. */
  at: number;
};

type Filter = "all" | "received" | "sent";

type Props = {
  items: HistoryItem[];
  /** Opens the file's folder. Leave it out where that isn't possible (a browser). */
  onShowInFolder?: (id: string) => void;
  /** Asks the peer to send a stopped file again. */
  onAskAgain: (id: string) => void;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const rowButton =
  "min-h-11 shrink-0 rounded-full border border-line bg-elevated px-4 text-sm font-medium text-ink transition-colors hover:bg-elevated/70 focus-visible:outline-2 focus-visible:outline-accent";

function HistoryRow({ item, onShowInFolder, onAskAgain }: { item: HistoryItem } & Omit<Props, "items">) {
  const receiving = item.status === "receiving";
  const stopped = item.status === "stopped";
  const percent = Math.round(item.progress ?? 0);
  const Icon = stopped ? CircleAlert : item.direction === "received" ? Download : Upload;
  const who = item.direction === "received" ? "from" : "to";

  return (
    <li
      className={`flex list-none items-center gap-4 rounded-2xl border bg-surface p-4 ${
        stopped ? "border-accent/40" : "border-line"
      }`}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-elevated">
        <Icon
          size={20}
          strokeWidth={stopped ? 2 : 1.8}
          aria-hidden="true"
          className={stopped ? "text-accent" : "text-ink"}
        />
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[15px] font-semibold text-ink" title={item.fileName}>
          {item.fileName}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {receiving && <span className="font-semibold text-ink">Receiving </span>}
          {stopped && <span className="font-semibold text-accent">Stopped at {percent}% · </span>}
          {!receiving && !stopped && (item.direction === "received" ? "Received " : "Sent ")}
          {who} {item.peerName}
          {item.peerDetail && <span className="font-mono"> {item.peerDetail}</span>}
          {" · "}
          <span className="font-mono">{formatFileSize(item.size)}</span>
        </p>
        {receiving && (
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-elevated"
            role="progressbar"
            aria-label={`Receiving ${item.fileName}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      {receiving && <span className="shrink-0 font-mono text-xs text-ink">{percent}%</span>}
      {!receiving && !stopped && <span className="shrink-0 text-xs text-muted">Done · {timeAgo(item.at)}</span>}
      {item.status === "done" && item.direction === "received" && onShowInFolder && (
        <button type="button" className={rowButton} onClick={() => onShowInFolder(item.id)}>
          Show in folder
        </button>
      )}
      {stopped && (
        <button type="button" className={rowButton} onClick={() => onAskAgain(item.id)}>
          Ask again
        </button>
      )}
    </li>
  );
}

export function HistoryList({ items, onShowInFolder, onAskAgain }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = items
    .filter((item) => filter === "all" || item.direction === filter)
    .sort((a, b) => b.at - a.at);

  const emptyText =
    items.length === 0
      ? "Nothing received or sent yet. Drop a file on the left to start."
      : `Nothing ${filter} yet.`;

  return (
    <section aria-label="History">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">History</h2>
        <div className="flex gap-2" role="group" aria-label="Filter history">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`min-h-11 rounded-full border px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                filter === id
                  ? "border-ink bg-ink text-ground"
                  : "border-line bg-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {visible.map((item) => (
            <HistoryRow key={item.id} item={item} onShowInFolder={onShowInFolder} onAskAgain={onAskAgain} />
          ))}
        </ul>
      )}
    </section>
  );
}