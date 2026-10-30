/**
 * Wire format for Peer Chat messages.
 *
 * Every message is a small JSON object: {"v":1,"kind":"text","text":"hi"}.
 * This module is pure (no React, no network) so it can be tested on its own.
 * decodeMessage never throws: bad input from a peer comes back as { ok: false }.
 * Lengths are counted in UTF-16 code units, the same way a textarea's maxLength counts.
 */

export const PROTOCOL_VERSION = 1;
export const MAX_TEXT_LENGTH = 2000;
export const MAX_NAME_LENGTH = 40;
export const MAX_STICKER_LENGTH = 16;
/** Anything longer than this is rejected before it is even parsed. */
export const MAX_ENCODED_LENGTH = 8192;

export type TextMessage = { kind: "text"; text: string };
/** A sticker is one emoji glyph for now. Image stickers arrive with file transfer. */
export type StickerMessage = { kind: "sticker"; glyph: string };
/** Sent when peers connect, and again whenever the display name changes. */
export type HelloMessage = { kind: "hello"; name: string };

export type WireMessage = TextMessage | StickerMessage | HelloMessage;
export type MessageKind = WireMessage["kind"];

export type DecodeResult =
  | { ok: true; message: WireMessage }
  | { ok: false; reason: string };

const fail = (reason: string): DecodeResult => ({ ok: false, reason });

function hasControlChars(value: string, allowLineBreaks: boolean): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 0x7f) return true;
    if (code < 0x20) {
      const isLineBreak = code === 0x0a || code === 0x09;
      if (allowLineBreaks && isLineBreak) continue;
      return true;
    }
  }
  return false;
}

type SegmenterLike = new (
  locale?: string,
  options?: { granularity: "grapheme" },
) => { segment(input: string): Iterable<unknown> };

/** One emoji can be several code points (a family, a skin tone), so count what a person sees. */
function isSingleGrapheme(value: string): boolean {
  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterLike }).Segmenter;
  if (!Segmenter) return true; // the length limit is the fallback
  let count = 0;
  for (const segment of new Segmenter(undefined, { granularity: "grapheme" }).segment(value)) {
    void segment;
    count += 1;
    if (count > 1) return false;
  }
  return count === 1;
}

function validateText(value: unknown): DecodeResult {
  if (typeof value !== "string") return fail("Text message has no text.");
  if (value.trim().length === 0) return fail("Text message is empty.");
  if (value.length > MAX_TEXT_LENGTH) return fail(`Text is longer than ${MAX_TEXT_LENGTH} characters.`);
  if (hasControlChars(value, true)) return fail("Text contains control characters.");
  return { ok: true, message: { kind: "text", text: value } };
}

function validateSticker(value: unknown): DecodeResult {
  if (typeof value !== "string") return fail("Sticker has no glyph.");
  if (value.trim().length === 0) return fail("Sticker is empty.");
  if (value.length > MAX_STICKER_LENGTH) return fail("Sticker is too long.");
  if (hasControlChars(value, false) || value.trim() !== value) return fail("Sticker contains invalid characters.");
  if (!isSingleGrapheme(value)) return fail("A sticker must be a single glyph.");
  return { ok: true, message: { kind: "sticker", glyph: value } };
}

function validateHello(value: unknown): DecodeResult {
  if (typeof value !== "string") return fail("Hello has no name.");
  const name = value.trim();
  if (name.length === 0) return fail("Name is empty.");
  if (name.length > MAX_NAME_LENGTH) return fail(`Name is longer than ${MAX_NAME_LENGTH} characters.`);
  if (hasControlChars(name, false)) return fail("Name contains control characters.");
  return { ok: true, message: { kind: "hello", name } };
}

/** Checks an unknown value and returns a clean message with only the known fields. */
export function validateMessage(candidate: unknown): DecodeResult {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return fail("Message is not an object.");
  }
  const record = candidate as Record<string, unknown>;
  if (record.v !== PROTOCOL_VERSION) return fail("Unsupported message version.");
  switch (record.kind) {
    case "text":
      return validateText(record.text);
    case "sticker":
      return validateSticker(record.glyph);
    case "hello":
      return validateHello(record.name);
    default:
      return fail("Unknown message kind.");
  }
}

/** Turns a message into the string that travels between peers. Throws if the message is invalid. */
export function encodeMessage(message: WireMessage): string {
  const checked = validateMessage({ ...message, v: PROTOCOL_VERSION });
  if (!checked.ok) throw new Error(`Cannot encode message: ${checked.reason}`);
  const encoded = JSON.stringify({ v: PROTOCOL_VERSION, ...checked.message });
  if (encoded.length > MAX_ENCODED_LENGTH) throw new Error("Cannot encode message: it is too large.");
  return encoded;
}

/** Turns what a peer sent into a message. Never throws. */
export function decodeMessage(raw: unknown): DecodeResult {
  if (typeof raw !== "string") return fail("Message is not text.");
  if (raw.length === 0) return fail("Message is empty.");
  if (raw.length > MAX_ENCODED_LENGTH) return fail("Message is too large.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail("Message is not valid JSON.");
  }
  return validateMessage(parsed);
}