import { useState } from "react";
import { Lock } from "lucide-react";
import Cards from "../components/Cards";
import { AttachmentUpload } from "../components/AttachmentUpload";
import { IncomingRequest } from "../components/IncomingRequest";
import type { IncomingRequestData } from "../components/IncomingRequest";
import { SaveLocation } from "../components/SaveLocation";
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

// Stand-in for telling the peer yes or no over the transport.
const fakeNetwork = () => new Promise<void>((resolve) => window.setTimeout(resolve, 1200));

const DEFAULT_SAVE_PATH = "Downloads/Peer Chat";

const Files = () => {
  const [selectedId, setSelectedId] = useState<string>("everyone");
  const [requests, setRequests] = useState<IncomingRequestData[]>(INITIAL_REQUESTS);
  const [savePath, setSavePath] = useState(DEFAULT_SAVE_PATH);

  const removeRequest = (id: string) =>
    setRequests((current) => current.filter((request) => request.id !== id));

  return (
    <div className="pb-10 mt-10 md:max-w-4xl mx-auto">
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

        <div className="flex flex-col gap-3">
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
                    onAccept={fakeNetwork}
                    onDecline={fakeNetwork}
                    onResolved={removeRequest}
                  />
                ))}
              </ul>
            </section>
          )}

          <SaveLocation path={savePath} onPick={pickFolder} onChange={setSavePath} />
        </div>
      </div>
    </div>
  );
};

export default Files;