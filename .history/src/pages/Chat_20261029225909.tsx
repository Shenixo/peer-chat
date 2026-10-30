import { useState } from "react";
import { Composer } from "../components/Composer";
import { Sidebar } from "../components/Sidebar";
import { dummyPeers } from "../lib/dummyData";
import type { ChatMessage } from "../types";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function addMine(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "me", text, sentAt: Date.now() },
    ]);
  }

  return (
    <div className="w-full gap-10 text-center flex items-center justify-between flex-col pb-10 mt-10 md:max-w-4xl mx-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-1 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_159_10/0.18),transparent_80%)]"
      />

      <div className="grid w-full grid-cols-[%_65%] gap-5">
        <Sidebar peers={dummyPeers} />

        <section className="flex h-[70vh] min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface text-left">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {messages.length === 0 ? (
              <p className="grid h-full place-items-center text-muted">
                No messages yet. Say hello.
              </p>
            ) : (
              <ul className="flex flex-col items-end gap-3">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className="max-w-[75%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-accent px-4 py-2.5 text-[15px] leading-snug text-accent-ink"
                  >
                    {message.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-line p-4">
            <Composer
              onSend={addMine}
              onAttach={(files) => files.forEach((file) => addMine(`Attached ${file.name}`))}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Chat;