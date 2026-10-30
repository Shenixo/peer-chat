import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "./arc/tabs/tabs";

const ITEMS = [
  { id: "room", label: "Room" },
  { id: "chat", label: "Chat" },
  { id: "transfers", label: "Transfers", disabled: true },
] as const;

const pillBase =
  "inline-flex h-12 items-center rounded-full border border-line backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none";

type NavbarProps = {
  peerCount?: number;
};

export default function Navbar({ peerCount = 0 }: NavbarProps) {
  const connected = peerCount > 0;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pill = `${pillBase} ${
    scrolled ? "bg-ground/70 shadow-lg shadow-black/30" : "bg-white/5"
  }`;

  return (
    <header className="sticky top-0 z-50 py-4 z">
      <div
        className={`mx-auto flex items-center justify-between gap-3 transition-[max-width] duration-500 ease-out motion-reduce:transition-none ${
          scrolled ? "max-w-[40rem]" : "max-w-4xl"
        }`}
      >
        <div className={`${pill} gap-2.5 px-5 font-semibold tracking-tight`}>
          <span className="size-3.5 rounded-[5px] bg-accent" aria-hidden="true" />
          Peer Chat
        </div>

        <Tabs defaultValue="room" className="hidden md:block">
          <TabsList aria-label="Screens">
            {ITEMS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                disabled={"disabled" in item ? item.disabled : false}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div
          className={`${pill} gap-2.5 px-5 text-[15px] font-medium text-muted`}
          aria-live="polite"
        >
          <span
            className={`size-2 rounded-full ${connected ? "bg-online" : "bg-faint"}`}
            aria-hidden="true"
          />
          {connected ? `${peerCount} connected` : "No server"}
        </div>
      </div>
    </header>
  );
}