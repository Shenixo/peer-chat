import { decodeMessage, encodeMessage } from "../lib/messages";
import type { WireMessage } from "../lib/messages";
import {
  EVERYONE,
  TransportError,
  createEmitter,
  defaultPeerName,
  peerSuffix,
} from "./ChatTransport";
import type {
  ChatTransport,
  FileDirection,
  FileEvent,
  FileTransport,
  IncomingMessage,
  PeerEvent,
  TransportPeer,
  Unsubscribe,
} from "./ChatTransport";

/**
 * A fake network for building the UI. Two pretend people live in the room:
 * Maya joins right after you, and Guest 4821 comes and goes. Everything they
 * "send" goes through encodeMessage and decodeMessage, so the UI only ever
 * sees messages the real validation accepted.
 */

export type MockTransportOptions = {
  /** How long the fake peer takes to reply, in milliseconds. */
  replyDelayMs?: number;
  /** Let Guest 4821 join and leave on a timer. Turn off for a quiet room. */
  autoChurn?: boolean;
  /** Speed used to fake file progress. */
  bytesPerSecond?: number;
};

const MIN_ROOM_CODE_LENGTH = 8;
const TICK_MS = 250;
const ACCEPT_DELAY_MS = 600;
const MB = 1024 * 1024;

export const MOCK_MAYA_ID = "4f2a91c0b7d3";
export const MOCK_GUEST_ID = "9c1d77e2a4f8";

const REPLIES = [
  "Got it.",
  "Sounds good to me.",
  "Haha, nice.",
  "Can you say that again?",
  "On my way.",
];

type MockTransfer = {
  id: string;
  peerId: string;
  name: string;
  size: number;
  direction: FileDirection;
  state: "offered" | "active";
  transferred: number;
  interval?: ReturnType<typeof setInterval>;
};

export class MockTransport implements ChatTransport {
  readonly files: FileTransport;

  private readonly replyDelayMs: number;
  private readonly autoChurn: boolean;
  private readonly bytesPerTick: number;

  private readonly messages = createEmitter<IncomingMessage>();
  private readonly peerEvents = createEmitter<PeerEvent>();
  private readonly errors = createEmitter<TransportError>();
  private readonly fileEvents = createEmitter<FileEvent>();

  private readonly peers = new Map<string, TransportPeer>();
  private readonly transfers = new Map<string, MockTransfer>();
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();
  private readonly intervals = new Set<ReturnType<typeof setInterval>>();

  private joined = false;
  /** Bumped on leave, so timers from an old session can tell they are stale. */
  private session = 0;
  private replyIndex = 0;
  private transferCounter = 0;

  constructor(options: MockTransportOptions = {}) {
    this.replyDelayMs = options.replyDelayMs ?? 900;
    this.autoChurn = options.autoChurn ?? true;
    this.bytesPerTick = ((options.bytesPerSecond ?? 2 * MB) * TICK_MS) / 1000;
    this.files = {
      offerFile: (file, to) => this.offerFile(file, to),
      acceptFile: (id) => this.acceptFile(id),
      declineFile: (id) => this.declineFile(id),
      cancelFile: (id) => this.cancelFile(id),
      onFile: (handler) => this.fileEvents.subscribe(handler),
    };
  }

  onMessage(handler: (incoming: IncomingMessage) => void): Unsubscribe {
    return this.messages.subscribe(handler);
  }

  onPeerChange(handler: (event: PeerEvent) => void): Unsubscribe {
    return this.peerEvents.subscribe(handler);
  }

  onError(handler: (error: TransportError) => void): Unsubscribe {
    return this.errors.subscribe(handler);
  }

  async join(roomCode: string): Promise<void> {
    if (this.joined) throw new TransportError("already-joined", "Already in a room.");
    if (roomCode.trim().length < MIN_ROOM_CODE_LENGTH) {
      throw new TransportError("invalid-room-code", `A room code needs at least ${MIN_ROOM_CODE_LENGTH} characters.`);
    }
    this.joined = true;
    this.later(400, () => this.addPeer(MOCK_MAYA_ID, "Maya"));
    if (this.autoChurn) {
      this.later(2500, () => this.addPeer(MOCK_GUEST_ID, "Guest 4821"));
      this.later(15000, () => this.removePeer(MOCK_GUEST_ID));
    }
  }

  async leave(): Promise<void> {
    if (!this.joined) return;
    this.joined = false;
    this.session += 1;
    this.timeouts.forEach((handle) => clearTimeout(handle));
    this.intervals.forEach((handle) => clearInterval(handle));
    this.timeouts.clear();
    this.intervals.clear();

    const open = [...this.transfers.values()];
    this.transfers.clear();
    for (const transfer of open) {
      this.fileEvents.emit({ type: "failed", transferId: transfer.id, direction: transfer.direction, reason: "You left the room." });
    }
    const gone = [...this.peers.keys()];
    this.peers.clear();
    for (const peerId of gone) this.peerEvents.emit({ type: "left", peerId });
  }

  async send(message: WireMessage, to?: string): Promise<void> {
    this.requireJoined();
    try {
      encodeMessage(message);
    } catch (reason) {
      throw new TransportError("invalid-message", reason instanceof Error ? reason.message : "Invalid message.");
    }
    if (message.kind === "hello") return; // nobody fake cares about a rename

    const target = to !== undefined && to !== EVERYONE ? this.requirePeer(to) : this.peers.values().next().value;
    if (!target) return;

    const reply: WireMessage =
      message.kind === "sticker"
        ? message
        : { kind: "text", text: REPLIES[this.replyIndex++ % REPLIES.length] ?? "OK." };
    this.later(this.replyDelayMs, () => {
      if (this.peers.has(target.id)) this.deliver(target.id, reply);
    });
  }

  /** Dev only: pretend a peer is offering you a file. Returns the transfer id. */
  simulateIncomingOffer(options: { peerId?: string; name?: string; size?: number } = {}): string {
    this.requireJoined();
    const peer = options.peerId ? this.requirePeer(options.peerId) : this.peers.values().next().value;
    if (!peer) throw new TransportError("no-peers", "Nobody else is in the room yet.");
    const transfer = this.createTransfer("receive", peer.id, options.name ?? "photo-from-maya.jpg", options.size ?? 3 * MB);
    this.fileEvents.emit({ type: "offered", transferId: transfer.id, peerId: peer.id, name: transfer.name, size: transfer.size });
    return transfer.id;
  }

  /** Dev only: make a running transfer fail, as if the connection dropped. */
  failTransfer(transferId: string, reason = "Connection lost."): void {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return;
    this.stopTransfer(transfer);
    this.transfers.delete(transferId);
    this.fileEvents.emit({ type: "failed", transferId, direction: transfer.direction, reason });
  }

  private async offerFile(file: File, to: string): Promise<string[]> {
    this.requireJoined();
    const targets = to === EVERYONE ? [...this.peers.values()] : [this.requirePeer(to)];
    if (targets.length === 0) throw new TransportError("no-peers", "Nobody else is in the room yet.");
    return targets.map((peer) => {
      const transfer = this.createTransfer("send", peer.id, file.name, file.size);
      // The fake peer always says yes, a moment later.
      this.later(ACCEPT_DELAY_MS, () => {
        if (!this.transfers.has(transfer.id)) return;
        this.fileEvents.emit({ type: "accepted", transferId: transfer.id, peerId: peer.id });
        this.startProgress(transfer);
      });
      return transfer.id;
    });
  }

  private async acceptFile(transferId: string): Promise<void> {
    this.requireJoined();
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.direction !== "receive" || transfer.state !== "offered") {
      throw new TransportError("unknown-transfer", "That file is no longer waiting.");
    }
    this.startProgress(transfer);
  }

  private async declineFile(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.direction !== "receive" || transfer.state !== "offered") {
      throw new TransportError("unknown-transfer", "That file is no longer waiting.");
    }
    this.transfers.delete(transferId);
  }

  private async cancelFile(transferId: string): Promise<void> {
    const transfer = this.transfers.get(transferId);
    if (!transfer) throw new TransportError("unknown-transfer", "That transfer is not running.");
    this.stopTransfer(transfer);
    this.transfers.delete(transferId);
    this.fileEvents.emit({ type: "cancelled", transferId, direction: transfer.direction });
  }

  private requireJoined(): void {
    if (!this.joined) throw new TransportError("not-joined", "Join a room first.");
  }

  private requirePeer(peerId: string): TransportPeer {
    const peer = this.peers.get(peerId);
    if (!peer) throw new TransportError("unknown-peer", "That person is not in the room.");
    return peer;
  }

  /** Runs later, but only if the session it was scheduled in is still open. */
  private later(delayMs: number, action: () => void): void {
    const session = this.session;
    const handle = setTimeout(() => {
      this.timeouts.delete(handle);
      if (session !== this.session || !this.joined) return;
      action();
    }, delayMs);
    this.timeouts.add(handle);
  }

  private addPeer(id: string, name: string): void {
    if (this.peers.has(id)) return;
    const peer: TransportPeer = { id, name: defaultPeerName(id), suffix: peerSuffix(id) };
    this.peers.set(id, peer);
    this.peerEvents.emit({ type: "joined", peer });
    // A real peer introduces itself with a hello right after connecting.
    this.later(60, () => this.deliver(id, { kind: "hello", name }));
  }

  private removePeer(id: string): void {
    if (!this.peers.delete(id)) return;
    for (const transfer of [...this.transfers.values()]) {
      if (transfer.peerId !== id) continue;
      this.stopTransfer(transfer);
      this.transfers.delete(transfer.id);
      this.fileEvents.emit({ type: "failed", transferId: transfer.id, direction: transfer.direction, reason: "Peer disconnected." });
    }
    this.peerEvents.emit({ type: "left", peerId: id });
  }

  private deliver(peerId: string, message: WireMessage): void {
    const decoded = decodeMessage(encodeMessage(message));
    if (!decoded.ok) {
      this.errors.emit(new TransportError("invalid-message", decoded.reason));
      return;
    }
    this.messages.emit({ peerId, message: decoded.message, receivedAt: Date.now() });
  }

  private createTransfer(direction: FileDirection, peerId: string, name: string, size: number): MockTransfer {
    this.transferCounter += 1;
    const transfer: MockTransfer = {
      id: `mock-transfer-${this.transferCounter}`,
      peerId,
      name,
      size,
      direction,
      state: direction === "send" ? "active" : "offered",
      transferred: 0,
    };
    this.transfers.set(transfer.id, transfer);
    return transfer;
  }

  private startProgress(transfer: MockTransfer): void {
    transfer.state = "active";
    const session = this.session;
    const interval = setInterval(() => {
      if (session !== this.session || !this.joined || !this.transfers.has(transfer.id)) {
        clearInterval(interval);
        this.intervals.delete(interval);
        return;
      }
      transfer.transferred = Math.min(transfer.size, transfer.transferred + this.bytesPerTick);
      this.fileEvents.emit({
        type: "progress",
        transferId: transfer.id,
        direction: transfer.direction,
        transferred: transfer.transferred,
        size: transfer.size,
      });
      if (transfer.transferred >= transfer.size) {
        this.stopTransfer(transfer);
        this.transfers.delete(transfer.id);
        this.fileEvents.emit({ type: "completed", transferId: transfer.id, direction: transfer.direction });
      }
    }, TICK_MS);
    transfer.interval = interval;
    this.intervals.add(interval);
  }

  private stopTransfer(transfer: MockTransfer): void {
    if (transfer.interval === undefined) return;
    clearInterval(transfer.interval);
    this.intervals.delete(transfer.interval);
    transfer.interval = undefined;
  }
}