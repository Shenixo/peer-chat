import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_GUEST_ID, MOCK_MAYA_ID, MockTransport } from "./mockTransport";
import { EVERYONE, TransportError } from "./ChatTransport";
import type { FileEvent, IncomingMessage, PeerEvent } from "./ChatTransport";

const CODE = "ROOMCODE12345678";
const fakeFile = (name: string, size: number) => ({ name, size }) as File;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function watch(transport: MockTransport) {
  const messages: IncomingMessage[] = [];
  const peers: PeerEvent[] = [];
  const files: FileEvent[] = [];
  transport.onMessage((value) => messages.push(value));
  transport.onPeerChange((value) => peers.push(value));
  transport.files.onFile((value) => files.push(value));
  return { messages, peers, files };
}

describe("MockTransport", () => {
  it("rejects a room code that is too short", async () => {
    const transport = new MockTransport();
    await expect(transport.join("abc")).rejects.toMatchObject({ code: "invalid-room-code" });
  });

  it("refuses to send before joining", async () => {
    const transport = new MockTransport();
    await expect(transport.send({ kind: "text", text: "hi" })).rejects.toBeInstanceOf(TransportError);
  });

  it("reports peers joining and leaving, with a hello from each", async () => {
    const transport = new MockTransport();
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(3000);
    expect(seen.peers.map((event) => event.type)).toEqual(["joined", "joined"]);
    expect(seen.messages.map((entry) => entry.message)).toEqual([
      { kind: "hello", name: "Maya" },
      { kind: "hello", name: "Guest 4821" },
    ]);
    vi.advanceTimersByTime(13000);
    expect(seen.peers.at(-1)).toEqual({ type: "left", peerId: MOCK_GUEST_ID });
  });

  it("replies to a text message after a short delay", async () => {
    const transport = new MockTransport({ autoChurn: false, replyDelayMs: 900 });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    seen.messages.length = 0;
    await transport.send({ kind: "text", text: "Hello" });
    vi.advanceTimersByTime(899);
    expect(seen.messages).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(seen.messages).toHaveLength(1);
    expect(seen.messages[0]?.peerId).toBe(MOCK_MAYA_ID);
    expect(seen.messages[0]?.message.kind).toBe("text");
  });

  it("does not deliver anything after leaving", async () => {
    const transport = new MockTransport({ autoChurn: false });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    await transport.send({ kind: "text", text: "Hello" });
    await transport.leave();
    seen.messages.length = 0;
    vi.advanceTimersByTime(60000);
    expect(seen.messages).toHaveLength(0);
    expect(seen.peers.at(-1)).toEqual({ type: "left", peerId: MOCK_MAYA_ID });
  });

  it("sends a file with progress and finishes it", async () => {
    const transport = new MockTransport({ autoChurn: false, bytesPerSecond: 1_000_000 });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    const ids = await transport.files.offerFile(fakeFile("a.pdf", 2_000_000), EVERYONE);
    expect(ids).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    const types = seen.files.map((event) => event.type);
    expect(types[0]).toBe("accepted");
    expect(types).toContain("progress");
    expect(types.at(-1)).toBe("completed");
  });

  it("receives a file only after it is accepted", async () => {
    const transport = new MockTransport({ autoChurn: false, bytesPerSecond: 1_000_000 });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    const id = transport.simulateIncomingOffer({ name: "pic.png", size: 1_000_000 });
    vi.advanceTimersByTime(5000);
    expect(seen.files.map((event) => event.type)).toEqual(["offered"]);
    await transport.files.acceptFile(id);
    vi.advanceTimersByTime(5000);
    expect(seen.files.at(-1)?.type).toBe("completed");
  });

  it("lets the person decline an offer", async () => {
    const transport = new MockTransport({ autoChurn: false });
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    const id = transport.simulateIncomingOffer();
    await transport.files.declineFile(id);
    await expect(transport.files.acceptFile(id)).rejects.toMatchObject({ code: "unknown-transfer" });
  });

  it("cancels a running transfer", async () => {
    const transport = new MockTransport({ autoChurn: false, bytesPerSecond: 100_000 });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    const [id] = await transport.files.offerFile(fakeFile("big.zip", 50_000_000), MOCK_MAYA_ID);
    vi.advanceTimersByTime(2000);
    await transport.files.cancelFile(id ?? "");
    expect(seen.files.at(-1)?.type).toBe("cancelled");
  });

  it("fails open transfers when the peer disconnects", async () => {
    const transport = new MockTransport({ bytesPerSecond: 10_000 });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(3000);
    await transport.files.offerFile(fakeFile("slow.zip", 90_000_000), MOCK_GUEST_ID);
    vi.advanceTimersByTime(13000);
    expect(seen.files.at(-1)).toMatchObject({ type: "failed", reason: "Peer disconnected." });
  });

  it("fails open transfers when you leave", async () => {
    const transport = new MockTransport({ autoChurn: false });
    const seen = watch(transport);
    await transport.join(CODE);
    vi.advanceTimersByTime(500);
    await transport.files.offerFile(fakeFile("x.zip", 90_000_000), EVERYONE);
    await transport.leave();
    expect(seen.files.at(-1)).toMatchObject({ type: "failed", reason: "You left the room." });
  });
});