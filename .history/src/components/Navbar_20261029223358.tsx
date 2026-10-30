import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "./arc/tabs/tabs";

const ITEMS = [
  { id: "room", label: "Room", path: "/" },
  { id: "chat", label: "Chat", path: "/chat" },
  { id: "transfers", label: "Transfers", path: "/files", disabled: false },
] as const;

type TabId = (typeof ITEMS)[number]["id"];

const surface = {
  top: "bg-surface/70",
  scrolled: "bg-ground/90 shadow-lg shadow-black/40",
};

const pillBase =
  "inline-flex h-12 items-center rounded-full border border-line backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none";

function tabFromPath(pathname: string): TabId {
  const match = ITEMS.find((item) =>
    item.path === "/"
      ? pathname === "/"
      : pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return match ? match.id : "room";
}

type NavbarProps = {
  peerCount?: number;
};

export default function Navbar({ peerCount = 0 }: NavbarProps) {
  const connected = peerCount > 0;
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleTabChange(value: string) {
    const item = ITEMS.find((entry) => entry.id === value);
    if (item) navigate(item.path);
  }

  const pill = `${pillBase} ${scrolled ? surface.scrolled : surface.top}`;

  const tabsList = `transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none ${
    scrolled ? "bg-ground/90! shadow-lg shadow-black/40" : "bg-surface/70!"
  }`;

  return (
    <header className="sticky top-0 z-100 py-4 ">
      <div
        className={`mx-auto flex items-center justify-between gap-3 transition-[max-width] duration-500 ease-out motion-reduce:transition-none ${
          scrolled ? "max-w-[40rem]" : "max-w-4xl"
        }`}
      >
        <div className={`${pill} gap-2.5 px-5 font-semibold tracking-tight`}>
          <span className="size-3.5 rounded-[5px] bg-accent" aria-hidden="true" />
          Peer Chat
        </div>

        <Tabs
          value={tabFromPath(pathname)}
          onValueChange={handleTabChange}
          className="hidden md:block"
        >
          <TabsList aria-label="Screens" className={tabsList}>
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