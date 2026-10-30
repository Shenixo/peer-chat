import { Tabs, TabsList, TabsTrigger } from "./arc/tabs/tabs";

const ITEMS = [
  { id: "room", label: "Room" },
  { id: "chat", label: "Chat" },
  { id: "transfers", label: "Transfers", disabled: true },
] as const;

const pill =
  "inline-flex h-12 items-center rounded-full border border-line bg-white/5 backdrop-blur-xl backdrop-saturate-150";

type NavbarProps = {
  peerCount?: number;
};

export default function Navbar({ peerCount = 0 }: NavbarProps) {
  const connected = peerCount > 0;

  return (
    <header className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
      <div className={`${pill} gap-2.5 px-5 font-semibold tracking-tight`}>
        <span className="size-3.5 rounded-[5px] bg-accent" aria-hidden="true" />
        Peer Chat
      </div>

      <Tabs defaultValue="room">
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
    </header>
  );
}