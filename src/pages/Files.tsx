import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Cards from "../components/Cards";
import { AttachmentUpload } from "../components/AttachmentUpload";
import { IncomingRequest } from "../components/IncomingRequest";
import type { IncomingRequestData } from "../components/IncomingRequest";
import { SaveLocation } from "../components/SaveLocation";
import { HistoryList } from "../components/HistoryList";
import type { HistoryItem } from "../components/HistoryList";
import { pickFolder } from "../lib/pickFolder";

type Recipient = {
  id: string;
  name: string;
  /** Short suffix from the connection id, so duplicate names can be told apart. */
  suffix?: string;
  /** Shown instead of the suffix, for the "everyone" option. */
  detail?: string;
};

// Dummy data for now. Once the store exists this comes from the peers list.
const RECIPIENTS: Recipient[] = [
  { id: "everyone", name: "Everyone in the room", detail: "3 peers" },
  { id: "maya", name: "Maya", suffix: "4F2A" },
  { id: "guest-4821", name: "Guest 4821", suffix: "9C1D" },
];

// Dummy requests. Later these come from the transport's incoming file events.
const INITIAL_REQUESTS: IncomingRequestData[] = [
  { id: "r1", fileName: "notes-oct-29.md", size: 12 * 1024, fromName: "Maya", fromSuffix: "4F2A" },
  { id: "r2", fileName: "setup-tools.exe", size: 6.2 * 1024 * 1024, fromName: "Guest 4821", fromSuffix: "9C1D" },
];

const MINUTE = 60 * 1000;

// Dummy history. Later this comes from a transfers slice in the store.
const INITIAL_HISTORY: HistoryItem[] = [
  { id: "h1", direction: "received", fileName: "brand-guidelines.pdf", size: 2.4 * 1024 * 1024, peerName: "Maya", peerDetail: "4F2A", status: "done", progress: 100, at: Date.now() - 2 * MINUTE },
  { id: "h2", direction: "sent", fileName: "logo-wordmark.svg", size: 86 * 1024, peerName: "everyone", peerDetail: "3 peers", status: "done", progress: 100, at: Date.now() - 14 * MINUTE },
  { id: "h3", direction: "received", fileName: "dataset-export.zip", size: 58 * 1024 * 1024, peerName: "Guest 4821", peerDetail: "9C1D", status: "stopped", progress: 78, at: Date.now() - 30 * MINUTE },
];

// Stand-in for telling the peer yes or no over the transport.
const fakeNetwork = () => new Promise<void>((resolve) => window.setTimeout(resolve, 1200));

const DEFAULT_SAVE_PATH = "Downloads/Peer Chat";

const Files = () => {
  const [selectedId, setSelectedId] = useState<string>("everyone");
  const [requests, setRequests] = useState<IncomingRequestData[]>(INITIAL_REQUESTS);
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [savePath, setSavePath] = useState(DEFAULT_SAVE_PATH);

  const removeRequest = (id: string) =>
    setRequests((current) => current.filter((request) => request.id !== id));

  // Accepting tells the peer yes, then the file starts arriving as a history row.
  const acceptRequest = async (id: string) => {
    await fakeNetwork();
    const request = requests.find((item) => item.id === id);
    if (!request) return;
    setHistory((current) => [
      {
        id: `recv-${id}`,
        direction: "received",
        fileName: request.fileName,
        size: request.size,
        peerName: request.fromName,
        peerDetail: request.fromSuffix,
        status: "receiving",
        progress: 0,
        at: Date.now(),
      },
      ...current,
    ]);
  };

  // Asking again restarts a stopped transfer from zero.
  const askAgain = (id: string) =>
    setHistory((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "receiving", progress: 0, at: Date.now() } : item,
      ),
    );

  // DUMMY: fakes incoming progress until the real transport reports it.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setHistory((current) => {
        if (!current.some((item) => item.status === "receiving")) return current;
        return current.map((item) => {
          if (item.status !== "receiving") return item;
          const next = (item.progress ?? 0) + 6;
          return next >= 100
            ? { ...item, status: "done", progress: 100, at: Date.now() }
            : { ...item, progress: next };
        });
      });
    }, 400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pb-10 mt-10 md:max-w-4xl mx-auto">
        <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-1 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_159_10/0.18),transparent_80%)]"
      />
      <h1 className="text-5xl text-left font-bold">Transfers</h1>
      <p className="mb-6 text-left text-muted mt-4 max-w-[50ch]">
        Files go straight from your device to theirs. Nothing is uploaded to a
        server.
      </p>
      <div className="grid w-full grid-cols-[40%_60%] gap-5">
        <div className="flex flex-col gap-4">
          <Cards padding="p-4 sm:p-4" borderRadius="rounded-2xl">
            <p className="mb-4 text-xs uppercase text-left text-muted">Send a file</p>
            <AttachmentUpload />

            <p className="my-4 text-xs uppercase text-left text-muted">Send to</p>
            <div className="flex flex-col gap-2">
              {RECIPIENTS.map((recipient) => {
                const selected = recipient.id === selectedId;
                return (
                  <button
                    key={recipient.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedId(recipient.id)}
                    className={`flex min-h-11 w-full items-center justify-between gap-6 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                      selected
                        ? "border-accent bg-elevated"
                        : "border-line bg-elevated/50 hover:bg-elevated"
                    }`}
                  >
                    <span className="truncate">{recipient.name}</span>
                    <span
                      className={`shrink-0 font-mono text-xs font-normal ${
                        selected ? "text-accent" : "text-muted"
                      }`}
                    >
                      {recipient.detail ?? recipient.suffix}
                    </span>
                  </button>
                );
              })}
            </div>
          </Cards>

          <Cards padding="p-4 sm:p-4" borderRadius="rounded-2xl">
            <div className="flex items-start gap-4">
              <Lock size={20} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-online" />
              <p className="text-left text-xs leading-relaxed text-muted">
                Encrypted between your device and theirs.
              </p>
            </div>
          </Cards>
        </div>

        <div className="flex flex-col gap-5">
          {requests.length > 0 && (
            <section aria-label="Incoming requests">
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Incoming requests
                </h2>
                <span className="font-mono text-xs text-accent">{requests.length} waiting</span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {requests.map((request) => (
                  <IncomingRequest
                    key={request.id}
                    request={request}
                    onAccept={acceptRequest}
                    onDecline={fakeNetwork}
                    onResolved={removeRequest}
                  />
                ))}
              </ul>
            </section>
          )}

          <SaveLocation path={savePath} onPick={pickFolder} onChange={setSavePath} />

          <HistoryList
            items={history}
            onAskAgain={askAgain}
            // onShowInFolder is left out on purpose: a browser can't open a folder.
            // In Electron, pass a handler that calls shell.showItemInFolder through the main process.
          />
        </div>
      </div>
    </div>
  );
};

export default Files;