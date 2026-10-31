import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_GUEST_ID, MOCK_MAYA_ID, MockTransport } from "../transport/mockTransport";
import { EVERYONE } from "../transport/ChatTransport";
import { changeName, joinRoom, leaveRoom, sendSticker, sendText } from "./chatSlice";
import { acceptRequest, declineRequest, sendFiles } from "./transfersSlice";
import { createAppStore } from "./store";

const CODE = "ROOMCODE12345678";
const fakeFile = (name: string, size: number) => ({ name, size }) as File;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function setup(options: ConstructorParameters<typeof MockTransport>[0] = { autoChurn: false }) {
  const transport = new MockTransport(options);
  const { store, dispose } = createAppStore(transport);
  return { transport, store, dispose };
}

async function joined(options?: ConstructorParameters<typeof MockTransport>[0]) {
  const context = setup(options);
  await context.store.dispatch(joinRoom(CODE));
  vi.advanceTimersByTime(500);
  return context;
}

const maya = (store: ReturnType<typeof setup>["store"]) =>
  store.getState().chat.peers.find((peer) => peer.id === MOCK_MAYA_ID);

describe("chat", () => {
  it("starts idle with a guest name", () => {
    const { store } = setup();
    const { chat } = store.getState();
    expect(chat.status).toBe("idle");
    expect(chat.myName).toMatch(/^Guest \d{4}$/);
    expect(chat.peers).toEqual([]);
  });

  it("joins a room and shows the peer under the name from their hello", async () => {
    const { store } = await joined();
    expect(store.getState().chat.status).toBe("joined");
    expect(store.getState().chat.roomCode).toBe(CODE);
    expect(maya(store)).toMatchObject({ name: "Maya", suffix: "4F2A", online: true });
  });

  it("shows an error when the room code is not valid", async () => {
    const { store } = setup();
    await store.dispatch(joinRoom("abc"));
    expect(store.getState().chat.status).toBe("error");
    expect(store.getState().chat.error).toMatch(/room code/i);
  });

  it("sends text and receives the reply on the left", async () => {
    const { store } = await joined();
    await store.dispatch(sendText("Hello"));
    expect(store.getState().chat.messages).toMatchObject([{ from: "me", text: "Hello", kind: "text" }]);
    vi.advanceTimersByTime(1000);
    const messages = store.getState().chat.messages;
    expect(messages).toHaveLength(2);
    expect(messages[1]).toMatchObject({ from: "peer", peerId: MOCK_MAYA_ID, kind: "text" });
  });

  it("sends a sticker as a sticker", async () => {
    const { store } = await joined();
    await store.dispatch(sendSticker("🔥"));
    expect(store.getState().chat.messages[0]).toMatchObject({ from: "me", text: "🔥", kind: "sticker" });
  });

  it("does nothing when sending before joining", async () => {
    const { store } = setup();
    await store.dispatch(sendText("Hello"));
    expect(store.getState().chat.messages).toEqual([]);
  });

  it("keeps a valid new name and rejects an empty one", async () => {
    const { store } = await joined();
    await store.dispatch(changeName("  Olaseni  "));
    expect(store.getState().chat.myName).toBe("Olaseni");
    await store.dispatch(changeName("   "));
    expect(store.getState().chat.myName).toBe("Olaseni");
    expect(store.getState().chat.error).toBeTruthy();
  });

  it("marks a peer offline when they leave", async () => {
    const { store } = await joined({ autoChurn: true });
    vi.advanceTimersByTime(3000);
    expect(store.getState().chat.peers.find((peer) => peer.id === MOCK_GUEST_ID)?.online).toBe(true);
    vi.advanceTimersByTime(13000);
    expect(store.getState().chat.peers.find((peer) => peer.id === MOCK_GUEST_ID)?.online).toBe(false);
  });

  it("resets the room on leave, keeps your name, and can join again", async () => {
    const { store } = await joined();
    await store.dispatch(changeName("Olaseni"));
    await store.dispatch(sendText("Hello"));
    await store.dispatch(leaveRoom());
    const { chat } = store.getState();
    expect(chat).toMatchObject({ status: "idle", roomCode: null, peers: [], messages: [], myName: "Olaseni" });
    await store.dispatch(joinRoom(CODE));
    expect(store.getState().chat.status).toBe("joined");
  });

  it("stops listening after dispose", async () => {
    const { store, dispose } = setup();
    await store.dispatch(joinRoom(CODE));
    dispose();
    vi.advanceTimersByTime(3000);
    expect(store.getState().chat.peers).toEqual([]);
  });
});

describe("transfers", () => {
  it("shows an incoming offer as a request with the sender's name", async () => {
    const { store, transport } = await joined();
    transport.simulateIncomingOffer({ name: "pic.png", size: 1_000_000 });
    expect(store.getState().transfers.requests).toMatchObject([
      { fileName: "pic.png", size: 1_000_000, fromName: "Maya", fromSuffix: "4F2A" },
    ]);
  });

  it("moves an accepted request into the history and finishes it", async () => {
    const { store, transport } = await joined({ autoChurn: false, bytesPerSecond: 1_000_000 });
    const id = transport.simulateIncomingOffer({ name: "pic.png", size: 1_000_000 });
    await store.dispatch(acceptRequest(id));
    expect(store.getState().transfers.requests).toEqual([]);
    expect(store.getState().transfers.history[0]).toMatchObject({ id, status: "receiving", direction: "received" });
    vi.advanceTimersByTime(600);
    const midway = store.getState().transfers.history[0];
    expect(midway?.progress).toBeGreaterThan(0);
    expect(midway?.progress).toBeLessThan(100);
    vi.advanceTimersByTime(5000);
    expect(store.getState().transfers.history[0]).toMatchObject({ status: "done", progress: 100 });
  });

  it("puts the request back if accepting fails", async () => {
    const { store, transport } = await joined();
    const id = transport.simulateIncomingOffer();
    // The transport forgets the offer without telling the store, so accepting it fails.
    await transport.files.declineFile(id);
    await store.dispatch(acceptRequest(id));
    expect(store.getState().transfers.history).toEqual([]);
    expect(store.getState().transfers.requests).toHaveLength(1);
    expect(store.getState().transfers.error).toBeTruthy();
  });

  it("removes a declined request", async () => {
    const { store, transport } = await joined();
    const id = transport.simulateIncomingOffer();
    await store.dispatch(declineRequest(id));
    expect(store.getState().transfers.requests).toEqual([]);
    expect(store.getState().transfers.history).toEqual([]);
  });

  it("sends a file to everyone, one row per person, and finishes it", async () => {
    const { store } = await joined({ autoChurn: false, bytesPerSecond: 1_000_000 });
    await store.dispatch(sendFiles({ files: [fakeFile("a.pdf", 1_000_000)], to: EVERYONE }));
    expect(store.getState().transfers.history).toMatchObject([
      { fileName: "a.pdf", direction: "sent", status: "sending", peerName: "Maya", peerDetail: "4F2A" },
    ]);
    vi.advanceTimersByTime(5000);
    expect(store.getState().transfers.history[0]).toMatchObject({ status: "done", progress: 100 });
  });

  it("stops a transfer where it was when the peer disconnects", async () => {
    const { store } = await joined({ autoChurn: true, bytesPerSecond: 100_000 });
    vi.advanceTimersByTime(3000);
    await store.dispatch(sendFiles({ files: [fakeFile("slow.zip", 90_000_000)], to: MOCK_GUEST_ID }));
    vi.advanceTimersByTime(13000);
    expect(store.getState().transfers.history[0]).toMatchObject({ status: "stopped", reason: "Peer disconnected." });
  });

  it("reports an error when sending to nobody", async () => {
    const { store } = setup({ autoChurn: false });
    await store.dispatch(joinRoom(CODE));
    await store.dispatch(sendFiles({ files: [fakeFile("a.pdf", 10)], to: EVERYONE }));
    expect(store.getState().transfers.error).toMatch(/nobody/i);
  });

  it("drops waiting requests on leave but keeps the history", async () => {
    const { store, transport } = await joined({ autoChurn: false, bytesPerSecond: 1_000_000 });
    const first = transport.simulateIncomingOffer({ size: 1_000_000 });
    await store.dispatch(acceptRequest(first));
    transport.simulateIncomingOffer({ name: "second.png" });
    await store.dispatch(leaveRoom());
    expect(store.getState().transfers.requests).toEqual([]);
    expect(store.getState().transfers.history[0]).toMatchObject({ status: "stopped", reason: "You left the room." });
  });
});