import { useRef, useState } from "react";
import type { Peer } from "../types";

type SidebarProps = {
  peers: Peer[];
};

export function Sidebar({ peers }: SidebarProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [showTop, setShowTop] = useState(false);

  function handleScroll() {
    const el = listRef.current;
    if (el) setShowTop(el.scrollTop > 120);
  }

  function backToTop() {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    listRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <aside className="relative rounded-card border border-line bg-surface p-5 text-left scroll-auto">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm text-muted">People</h2>
        <span className="text-sm text-faint">{peers.length}</span>
      </div>

      <ul
        ref={listRef}
        onScroll={handleScroll}
        className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto pb-14 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {peers.map((peer) => (
          <li
            key={peer.id}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 transition-colors hover:bg-white/5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-sm font-semibold">
              {peer.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{peer.name}</span>
            <span
              role="img"
              aria-label={peer.online ? "Online" : "Offline"}
              className={`size-2 shrink-0 rounded-full ${
                peer.online ? "bg-online" : "bg-faint"
              }`}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={backToTop}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
        className={`absolute bottom-4 right-4 grid size-10 place-items-center rounded-full border border-line bg-ground/90 text-ink shadow-lg shadow-black/40 backdrop-blur-xl transition-opacity duration-300 hover:bg-elevated motion-reduce:transition-none ${
          showTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </button>
    </aside>
  );
}
