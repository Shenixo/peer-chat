import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ComposerProps = {
  onSend: (text: string) => void;
  onAttach?: (files: File[]) => void;
  disabled?: boolean;
};

const MAX_LENGTH = 2000;
const MAX_HEIGHT = 128;

export function Composer({ onSend, onAttach, disabled = false }: ComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && text.trim().length > 0;

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
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

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-elevated transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20">
        {onAttach && (
          <>
            <button
              type="button"
              aria-label="Attach a file"
              disabled={disabled}
              onClick={() => fileRef.current?.click()}
              className="grid size-12 shrink-0 place-items-center text-muted transition-colors hover:text-ink disabled:opacity-35"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} />
          </>
        )}

        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder="Message"
          aria-label="Message"
          className={`min-h-12 flex-1 resize-none bg-transparent py-3 pr-5 text-[15px] leading-6 text-ink outline-none placeholder:text-faint [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            onAttach ? "pl-1" : "pl-5"
          }`}
        />
      </div>

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition hover:bg-accent-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7z" />
        </svg>
      </button>
    </form>
  );
}