import { useState } from "react";
import Cards from "../components/Cards";
import { AttachmentUpload } from "../components/AttachmentUpload";
import { Lock } from "lucide-react";

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

const Files = () => {
  const [selectedId, setSelectedId] = useState<string>("everyone");

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
          <p className="mb-4 text-xs uppercase text-left text-muted">
            Send a file
          </p>
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
                      <div className="flex items-start gap-4" >
                           <Lock
      size={20}
      strokeWidth={1.8}
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-online"
    />
                            <p className=" text-xs text-left text-muted">Encrypted between your device and theirs. Received files are saved to your Downloads folder, and only people with the room code can send to you.</p>
                   </div>
                   </Cards>
              </div>
      </div>
    </div>
  );
};

export default Files;