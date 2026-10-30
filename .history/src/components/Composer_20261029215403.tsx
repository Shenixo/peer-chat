import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type ComposerProps = {
  onSend: (text: string) => void;
  onAttach?: (files: File[]) => void;
  onSticker?: (glyph: string) => void;
  disabled?: boolean;
};

type Panel = "emoji" | "sticker" | null;

const MAX_LENGTH = 2000;
const MAX_HEIGHT = 128;

const EMOJI = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
  "🤔", "😅", "😉", "🙂", "🙃", "😴", "😮", "😢",
  "😭", "😡", "🥳", "🤗", "🤝", "🙏", "👍", "👎",
  "👏", "🙌", "👋", "💪", "🤞", "✌️", "👌", "🫶",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔",
  "🔥", "✨", "🎉", "🎂", "🎁", "💯", "✅", "❌",
  "⭐", "🌟", "☀️", "🌙", "🌧️", "🍕", "🍔", "☕",
  "⚽", "🎵", "🚀", "💻", "📎", "📷", "🔒", "👀",
];

const STICKERS = [
  { glyph: "👍", label: "Thumbs up" },
  { glyph: "❤️", label: "Heart" },
  { glyph: "😂", label: "Laughing" },
  { glyph: "🔥", label: "Fire" },
  { glyph: "🎉", label: "Party" },
  { glyph: "🙏", label: "Thank you" },
  { glyph: "😮", label: "Surprised" },
  { glyph: "😢", label: "Sad" },
  { glyph: "👏", label: "Clapping" },
  { glyph: "💯", label: "One hundred" },
  { glyph: "🚀", label: "Rocket" },
  { glyph: "✅", label: "Done" },
];

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconButton({
  label,
  active = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-11 shrink-0 place-items-center transition-colors disabled:opacity-35 ${
        active ? "text-accent" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Composer({
  onSend,
  onAttach,
  onSticker,
  disabled = false,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && text.trim().length > 0;

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    if (!panel) return;
    function onPointerDown(event: MouseEvent) {
      if (!formRef.current?.contains(event.target as Node)) setPanel(null);
    }
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    setPanel(null);
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) onAttach?.(files);
  }

  function insertEmoji(glyph: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + glyph + text.slice(end);
    if (next.length > MAX_LENGTH) return;
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + glyph.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function sendSticker(glyph: string) {
    onSticker?.(glyph);
    setPanel(null);
  }

  function togglePanel(next: Exclude<Panel, null>) {
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="relative flex items-end gap-3">
      {panel && (
        <div
          role="dialog"
          aria-label={panel === "emoji" ? "Emoji picker" : "Sticker picker"}
          className="absolute bottom-full left-0 z-20 mb-3 w-80 max-w-full rounded-card border border-line bg-ground/95 p-3 shadow-xl shadow-black/50 backdrop-blur-xl"
        >
          {panel === "emoji" ? (
            <ul className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {EMOJI.map((glyph) => (
                <li key={glyph}>
                  <button
                    type="button"
                    onClick={() => insertEmoji(glyph)}
                    className="grid size-9 w-full place-items-center rounded-xl text-xl transition-colors hover:bg-white/10"
                  >
                    {glyph}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-4 gap-2">
              {STICKERS.map((sticker) => (
                <li key={sticker.label}>
                  <button
                    type="button"
                    aria-label={`Send sticker: ${sticker.label}`}
                    onClick={() => sendSticker(sticker.glyph)}
                    className="grid aspect-square w-full place-items-center rounded-2xl text-4xl transition hover:scale-105 hover:bg-white/10"
                  >
                    {sticker.glyph}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-elevated transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20">
        <div className="flex shrink-0 items-center pl-1">
          <IconButton
            label="Emoji"
            active={panel === "emoji"}
            disabled={disabled}
            onClick={() => togglePanel("emoji")}
          >
            <svg {...iconProps}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
          </IconButton>

          {onSticker && (
            <IconButton
              label="Stickers"
              active={panel === "sticker"}
              disabled={disabled}
              onClick={() => togglePanel("sticker")}
            >
              <svg {...iconProps}>
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M15 3v5a1 1 0 0 0 1 1h5" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              </svg>
            </IconButton>
          )}
        </div>

        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setPanel(null)}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder="Message"
          aria-label="Message"
          className={`min-h-12 min-w-0 flex-1 resize-none bg-transparent py-3 pl-1 text-[15px] leading-6 text-ink outline-none placeholder:text-faint [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            onAttach ? "pr-1" : "pr-5"
          }`}
        />

        {onAttach && (
          <div className="flex shrink-0 items-center pr-1">
            <IconButton
              label="Attach a file"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
            >
              <svg {...iconProps}>
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </IconButton>
            <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition hover:bg-accent-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg {...iconProps}>
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
      </button>
    </form>
  );
}