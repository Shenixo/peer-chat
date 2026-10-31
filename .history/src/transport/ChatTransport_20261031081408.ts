import type { WireMessage } from "../lib/messages";

/**
 * The only thing the UI and the store know about the network.
 * MockTransport implements it for building the screens, and the real
 * Pear and Hyperswarm transport will implement the same interface.
 */

export type Unsubscribe = () => void;

/** Pass this as the recipient to mean every peer in the room. */
export const EVERYONE = "everyone";

export type TransportPeer = {
  id: string;
  /** Starts as "Guest XXXX" and is replaced when the peer's hello message arrives. */
  name: string;
  /** Four characters from the connection id, so duplicate names can be told apart. */
  suffix: string;
};

export type PeerEvent =
  | { type: "joined"; peer: TransportPeer }
  | { type: "left"; peerId: string };

export type IncomingMessage = {
  peerId: string;
  message: WireMessage;
  receivedAt: number;
};

export type FileDirection = "send" | "receive";

export type FileEvent =
  /** A peer wants to send you a file. Nothing is saved until you call acceptFile. */
  | { type: "offered"; transferId: string; peerId: string; name: string; size: number }
  /** The peer said yes to a file you offered. */
  | { type: "accepted"; transferId: string; peerId: string }
  /** The peer said no to a file you offered. */
  | { type: "declined"; transferId: string; peerId: string }
  | { type: "progress"; transferId: string; direction: FileDirection; transferred: number; size: number }
  | { type: "completed"; transferId: string; direction: FileDirection }
  | { type: "failed"; transferId: string; direction: FileDirection; reason: string }
  | { type: "cancelled"; transferId: string; direction: FileDirection };

/** One transfer per recipient, so the UI knows which transfer belongs to which person. */
export type OutgoingTransfer = { transferId: string; peerId: string };

export interface FileTransport {
  /** Offers a file to one peer, or to everyone. Returns one entry per recipient. */
  offerFile(file: File, to: string): Promise<OutgoingTransfer[]>;
  acceptFile(transferId: string): Promise<void>;
  declineFile(transferId: string): Promise<void>;
  /** Stops a transfer that is waiting or running, in either direction. */
  cancelFile(transferId: string): Promise<void>;
  onFile(handler: (event: FileEvent) => void): Unsubscribe;
}

export interface ChatTransport {
  /** Connects to the room. Rejects with a TransportError if the code is not valid. */
  join(roomCode: string): Promise<void>;
  /** Closes the connection and releases everything it holds. Safe to call twice. */
  leave(): Promise<void>;
  /** Sends to one peer, or to everyone when `to` is left out. */
  send(message: WireMessage, to?: string): Promise<void>;
  onMessage(handler: (incoming: IncomingMessage) => void): Unsubscribe;
  onPeerChange(handler: (event: PeerEvent) => void): Unsubscribe;
  /** Problems that do not belong to a single call, such as a malformed message from a peer. */
  onError(handler: (error: TransportError) => void): Unsubscribe;
  /** Missing when the transport cannot send files yet. */
  readonly files?: FileTransport;
}

export type TransportErrorCode =
  | "not-joined"
  | "already-joined"
  | "invalid-room-code"
  | "invalid-message"
  | "unknown-peer"
  | "unknown-transfer"
  | "no-peers"
  | "failed";

export class TransportError extends Error {
  readonly code: TransportErrorCode;

  constructor(code: TransportErrorCode, message: string) {
    super(message);
    this.name = "TransportError";
    this.code = code;
  }
}

export function peerSuffix(peerId: string): string {
  return peerId.slice(0, 4).toUpperCase();
}

export function defaultPeerName(peerId: string): string {
  return `Guest ${peerSuffix(peerId)}`;
}

export type Emitter<T> = {
  subscribe(handler: (value: T) => void): Unsubscribe;
  emit(value: T): void;
  clear(): void;
};

/** A tiny event list. One failing handler never stops the others. */
export function createEmitter<T>(): Emitter<T> {
  const handlers = new Set<(value: T) => void>();
  return {
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    emit(value) {
      for (const handler of [...handlers]) {
        try {
          handler(value);
        } catch (reason) {
          console.error("A transport handler threw an error", reason);
        }
      }
    },
    clear() {
      handlers.clear();
    },
  };
}