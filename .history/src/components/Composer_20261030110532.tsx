import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  PickerPopover,
  POPOVER_WIDTH,
  type PickerAnchor,
  type PickerItem,
} from "./PickerPopover";
import VoicePill from "./VoicePill";

export type VoiceNote = {
  blob: Blob;
  /** Length measured by the composer, in milliseconds. */
  durationMs: number;
};

type ComposerProps = {
  onSend: (text: string) => void;
  onAttach?: (files: File[]) => void;
  onSticker?: (glyph: string) => void;
  /** When given, an empty composer shows the voice pill in place of the send button. */
  onVoiceNote?: (note: VoiceNote) => void;
  disabled?: boolean;
};

type Panel = "emoji" | "sticker" | null;

const MAX_LENGTH = 2000;
const MAX_HEIGHT = 128;
/** Recordings shorter than this are treated as accidental taps and dropped. */
const MIN_VOICE_MS = 500;

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

const EMOJI_ITEMS: PickerItem[] = EMOJI.map((glyph) => ({
  value: glyph,
  label: glyph,
}));
const STICKER_ITEMS: PickerItem[] = STICKERS.map((sticker) => ({
  value: sticker.glyph,
  label: sticker.label,
}));

const COLUMNS = { emoji: 8, sticker: 4 } as const;

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
  btnRef,
  controls,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  btnRef?: Ref<HTMLButtonElement>;
  controls?: string;
  children: ReactNode;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={label}
      aria-haspopup={controls ? "listbox" : undefined}
      aria-expanded={controls ? active : undefined}
      aria-controls={controls && active ? controls : undefined}
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
  onVoiceNote,
  disabled = false,
}: ComposerProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optionPrefix = `${uid}-option`;

  const [text, setText] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [anchor, setAnchor] = useState<PickerAnchor | null>(null);
  const [active, setActive] = useState(0);
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiBtn = useRef<HTMLButtonElement>(null);
  const stickerBtn = useRef<HTMLButtonElement>(null);

  // Voice recorder state lives in refs because the pill calls these from its own events.
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const startingRef = useRef<Promise<void> | null>(null);

  const hasText = text.trim().length > 0;
  const canSend = !disabled && hasText;
  const showVoice = Boolean(onVoiceNote) && !hasText;
  const locked = disabled || recording;

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  // Release the microphone if the composer goes away mid recording.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function measure(kind: Exclude<Panel, null>): PickerAnchor | null {
    const form = formRef.current;
    const button = (kind === "emoji" ? emojiBtn : stickerBtn).current;
    if (!form || !button) return null;

    const f = form.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    const roomBelow = window.innerHeight - b.bottom;
    const above = roomBelow < 340 && b.top > roomBelow;
    const x = Math.max(0, Math.min(b.left - f.left - 10, f.width - POPOVER_WIDTH));
    const y = above ? f.bottom - b.top + 8 : b.bottom - f.top + 8;
    const originX = b.left - f.left + b.width / 2 - x;
    return { x, y, above, originX };
  }

  function closePanel() {
    setPanel(null);
    setAnchor(null);
  }

  function togglePanel(kind: Exclude<Panel, null>) {
    if (panel === kind) {
      closePanel();
      return;
    }
    setActive(0);
    setAnchor(measure(kind));
    setPanel(kind);
    inputRef.current?.focus();
  }

  useEffect(() => {
    if (!panel) return;
    const kind = panel;
    function onResize() {
      setAnchor(measure(kind));
    }
    function onPointerDown(event: MouseEvent) {
      if (!formRef.current?.contains(event.target as Node)) closePanel();
    }
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [panel]);

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    closePanel();
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
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

  function insertNewline() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + "\n" + text.slice(end);
    if (next.length > MAX_LENGTH) return;
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  function sendSticker(glyph: string) {
    onSticker?.(glyph);
    closePanel();
  }

  function handlePick(value: string) {
    if (panel === "emoji") insertEmoji(value);
    else if (panel === "sticker") sendSticker(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter (or Cmd+Enter) always starts a new line, like Shift+Enter.
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey) &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      insertNewline();
      return;
    }

    if (panel) {
      const items = panel === "emoji" ? EMOJI_ITEMS : STICKER_ITEMS;
      const columns = COLUMNS[panel];
      let step = 0;
      switch (event.key) {
        case "ArrowRight":
          step = 1;
          break;
        case "ArrowLeft":
          step = -1;
          break;
        case "ArrowDown":
          step = columns;
          break;
        case "ArrowUp":
          step = -columns;
          break;
      }
      if (step !== 0) {
        event.preventDefault();
        setActive((current) => {
          const next = current + step;
          return next >= 0 && next < items.length ? next : current;
        });
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closePanel();
        return;
      }
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        const picked = items[active];
        if (picked) {
          if (panel === "emoji") {
            insertEmoji(picked.value);
            closePanel();
          } else {
            sendSticker(picked.value);
          }
        }
        return;
      }
    }

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

  function startRecording() {
    setVoiceError("");
    setRecording(true);
    closePanel();
    startingRef.current = (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
          throw new Error("unsupported");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        streamRef.current = stream;
        recorderRef.current = recorder;
        startedAtRef.current = performance.now();
        recorder.start();
      } catch {
        // `recording` stays on until the pill reports it has stopped, so the bar and the pill agree.
        setVoiceError("The microphone isn't available. Allow microphone access for this site and try again.");
      }
    })();
  }

  async function stopRecording(reason: string) {
    setRecording(false);
    // A quick tap can stop before the microphone has opened, so wait for it.
    await startingRef.current;
    const recorder = recorderRef.current;
    const stream = streamRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const durationMs = performance.now() - startedAtRef.current;
    const cancelled = reason.toLowerCase().includes("cancel");
    recorder.onstop = () => {
      stream?.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      recorderRef.current = null;
      streamRef.current = null;
      if (!cancelled && durationMs >= MIN_VOICE_MS && blob.size > 0) {
        onVoiceNote?.({ blob, durationMs: Math.round(durationMs) });
      }
    };
    recorder.stop();
  }

  const items = panel === "sticker" ? STICKER_ITEMS : EMOJI_ITEMS;
  const columns = panel === "sticker" ? COLUMNS.sticker : COLUMNS.emoji;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative flex flex-wrap items-end gap-3"
    >
      {voiceError && (
        <p className="order-first w-full text-left text-xs text-danger" role="alert">
          {voiceError}
        </p>
      )}

      <PickerPopover
        open={panel !== null}
        popoverKey={panel ?? "none"}
        anchor={anchor}
        label={panel === "sticker" ? "Stickers" : "Emoji"}
        listId={listId}
        optionIdPrefix={optionPrefix}
        items={items}
        columns={columns}
        size={panel === "sticker" ? "lg" : "sm"}
        activeIndex={active}
        onActiveChange={setActive}
        onPick={handlePick}
      />

      <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-elevated transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20">
        <div className="flex shrink-0 items-center pl-1">
          <IconButton
            label="Emoji"
            active={panel === "emoji"}
            disabled={locked}
            btnRef={emojiBtn}
            controls={listId}
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
              disabled={locked}
              btnRef={stickerBtn}
              controls={listId}
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
          onChange={(event) => {
            setText(event.target.value);
            if (panel) closePanel();
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          disabled={locked}
          placeholder={recording ? "" : "Message"}
          aria-label="Message"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={panel !== null}
          aria-controls={panel ? listId : undefined}
          aria-activedescendant={panel ? `${optionPrefix}-${active}` : undefined}
          className={`min-h-12 min-w-0 flex-1 resize-none bg-transparent py-3 pl-1 text-[15px] leading-6 text-ink outline-none placeholder:text-faint [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            onAttach && !recording ? "pr-1" : "pr-5"
          }`}
        />

        {/* The paperclip is removed while recording, so the pill's Cancel label has nothing to overlap. */}
        {onAttach && !recording && (
          <div className="flex shrink-0 items-center pr-1">
            <IconButton
              label="Attach a file"
              disabled={locked}
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

      {showVoice ? (
        <div className="relative z-10 grid size-12 shrink-0 place-items-center">
          <VoicePill
            accentColor="#f5f5f5"
            iconColor="#a1a1aa"
            background="#27272a"
            size={48}
            shape="pill"
            reach={8}
            showTime
            waveform
            slideToCancel={false}
            cancelDistance={64}
            attack={40}
            release={240}
            sensitivity={1}
            floor={0.1}
            openDuration={200}
            pressScale={0.95}
            mode="auto"
            holdAfter={300}
            reactive="simulated"
            onStart={() => startRecording()}
            onStop={({ reason }: { reason: string }) => {
              void stopRecording(String(reason));
            }}
          />
        </div>
      ) : (
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
      )}
    </form>
  );
}