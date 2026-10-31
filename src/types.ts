export type Peer = {
  id: string;
  name: string;
  online: boolean;
  /** Four characters from the connection id, so duplicate names can be told apart. */
  suffix?: string;
};

export type ChatMessage = {
  id: string;
  from: "me" | "peer";
  /** Who sent it, for messages that came from a peer. */
  peerId?: string;
  /** The message text, or the emoji glyph when kind is "sticker". */
  text: string;
  kind?: "text" | "sticker";
  sentAt: number;
};

/** A file someone wants to send you, waiting for Accept or Decline. */
export type TransferRequest = {
  id: string;
  fileName: string;
  /** Size in bytes. */
  size: number;
  fromName: string;
  fromSuffix: string;
};

/** One row in the Transfers history. */
export type TransferItem = {
  id: string;
  direction: "received" | "sent";
  fileName: string;
  /** Size in bytes. */
  size: number;
  /** Who it came from or went to. */
  peerName: string;
  peerDetail?: string;
  status: "sending" | "receiving" | "done" | "stopped";
  /** 0 to 100. Where a stopped transfer ended. */
  progress?: number;
  /** Why a transfer stopped, when known. */
  reason?: string;
  /** When it finished or stopped, in milliseconds. */
  at: number;
};