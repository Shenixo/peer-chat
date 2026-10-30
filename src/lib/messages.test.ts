import { describe, expect, it } from "vitest";
import {
  MAX_ENCODED_LENGTH,
  MAX_NAME_LENGTH,
  MAX_TEXT_LENGTH,
  decodeMessage,
  encodeMessage,
} from "./messages";
import type { WireMessage } from "./messages";

function roundTrip(message: WireMessage) {
  return decodeMessage(encodeMessage(message));
}

describe("valid messages", () => {
  it("round trips a text message", () => {
    expect(roundTrip({ kind: "text", text: "Hello there" })).toEqual({
      ok: true,
      message: { kind: "text", text: "Hello there" },
    });
  });

  it("keeps line breaks inside text", () => {
    const result = roundTrip({ kind: "text", text: "line one\nline two" });
    expect(result).toEqual({ ok: true, message: { kind: "text", text: "line one\nline two" } });
  });

  it("round trips a sticker, including a multi part emoji", () => {
    expect(roundTrip({ kind: "sticker", glyph: "🔥" }).ok).toBe(true);
    expect(roundTrip({ kind: "sticker", glyph: "👨‍👩‍👧‍👦" }).ok).toBe(true);
  });

  it("round trips a hello and trims the name", () => {
    expect(roundTrip({ kind: "hello", name: "  Maya  " })).toEqual({
      ok: true,
      message: { kind: "hello", name: "Maya" },
    });
  });

  it("accepts text exactly at the length limit", () => {
    expect(roundTrip({ kind: "text", text: "a".repeat(MAX_TEXT_LENGTH) }).ok).toBe(true);
  });

  it("drops fields it does not know", () => {
    const raw = JSON.stringify({ v: 1, kind: "text", text: "hi", extra: "ignored", admin: true });
    expect(decodeMessage(raw)).toEqual({ ok: true, message: { kind: "text", text: "hi" } });
  });
});

describe("rejected input", () => {
  const rejected: [string, unknown][] = [
    ["not a string", 42],
    ["empty string", ""],
    ["not JSON", "{oops"],
    ["a JSON number", "7"],
    ["a JSON array", "[]"],
    ["null", "null"],
    ["missing version", JSON.stringify({ kind: "text", text: "hi" })],
    ["wrong version", JSON.stringify({ v: 2, kind: "text", text: "hi" })],
    ["unknown kind", JSON.stringify({ v: 1, kind: "image", url: "x" })],
    ["text field missing", JSON.stringify({ v: 1, kind: "text" })],
    ["text is a number", JSON.stringify({ v: 1, kind: "text", text: 5 })],
    ["whitespace only text", JSON.stringify({ v: 1, kind: "text", text: "   \n " })],
    ["text over the limit", JSON.stringify({ v: 1, kind: "text", text: "a".repeat(MAX_TEXT_LENGTH + 1) })],
    ["text with a control character", JSON.stringify({ v: 1, kind: "text", text: "hi\u0000there" })],
    ["sticker with two glyphs", JSON.stringify({ v: 1, kind: "sticker", glyph: "👍👍" })],
    ["sticker that is only a space", JSON.stringify({ v: 1, kind: "sticker", glyph: " " })],
    ["sticker that is too long", JSON.stringify({ v: 1, kind: "sticker", glyph: "x".repeat(40) })],
    ["hello with an empty name", JSON.stringify({ v: 1, kind: "hello", name: "   " })],
    ["hello with a long name", JSON.stringify({ v: 1, kind: "hello", name: "n".repeat(MAX_NAME_LENGTH + 1) })],
    ["hello with a newline in the name", JSON.stringify({ v: 1, kind: "hello", name: "a\nb" })],
    ["input over the size limit", "x".repeat(MAX_ENCODED_LENGTH + 1)],
  ];

  it.each(rejected)("rejects %s", (_label, raw) => {
    const result = decodeMessage(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("never throws, whatever it is given", () => {
    for (const value of [undefined, null, {}, [], Symbol.for("x"), () => 1]) {
      expect(() => decodeMessage(value)).not.toThrow();
    }
  });
});

describe("encodeMessage", () => {
  it("throws for an invalid message instead of sending it", () => {
    expect(() => encodeMessage({ kind: "text", text: "" })).toThrow();
    expect(() => encodeMessage({ kind: "text", text: "a".repeat(MAX_TEXT_LENGTH + 1) })).toThrow();
    expect(() => encodeMessage({ kind: "hello", name: "" })).toThrow();
  });

  it("produces versioned JSON", () => {
    expect(JSON.parse(encodeMessage({ kind: "text", text: "hi" }))).toEqual({ v: 1, kind: "text", text: "hi" });
  });
});