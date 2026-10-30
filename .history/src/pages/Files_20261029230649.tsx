import { useState } from "react";
import Cards from "../components/Cards";
import { AttachmentUpload } from "../components/AttachmentUpload";
import { Button } from "../components/arc/button/button";

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
                <Button
                  key={recipient.id}
                  variant="secondary"
                  size="md"
                  aria-pressed={selected}
                  className={`w-full gap-6 flex items-center justify-between ${
                    selected ? "border border-accent" : ""
                  }`}
                  onClick={() => setSelectedId(recipient.id)}
                >
                  <span>{recipient.name}</span>
                  <span
                    className={`font-mono text-xs ${
                      selected ? "text-accent" : "text-muted"
                    }`}
                  >
                    {recipient.detail ?? recipient.suffix}
                  </span>
                </Button>
              );
            })}
          </div>
        </Cards>
      </div>
    </div>
  );
};

export default Files;