import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { PROTOCOL_VERSION, validateMessage } from "../lib/messages";
import type { ChatTransport, TransportPeer } from "../transport/ChatTransport";
import type { ChatMessage, Peer } from "../types";

export type ConnectionStatus = "idle" | "joining" | "joined" | "error";

export type ChatState = {
  roomCode: string | null;
  status: ConnectionStatus;
  error: string | null;
  /** Your own display name. A claim, not proof of identity. */
  myName: string;
  peers: Peer[];
  messages: ChatMessage[];
};

/** What the store hands to every thunk. Nothing outside the store imports the transport. */
export type ThunkExtra = { transport: ChatTransport };

export type ThunkConfig = {
  state: { chat: ChatState };
  extra: ThunkExtra;
  rejectValue: string;
};

export function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export function randomGuestName(): string {
  return `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
}

function createInitialState(): ChatState {
  return { roomCode: null, status: "idle", error: null, myName: randomGuestName(), peers: [], messages: [] };
}

export const joinRoom = createAsyncThunk<string, string, ThunkConfig>(
  "chat/joinRoom",
  async (code, { extra, rejectWithValue }) => {
    try {
      await extra.transport.join(code);
      return code.trim();
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "Could not join the room."));
    }
  },
  {
    condition: (_code, { getState }) => {
      const { status } = getState().chat;
      return status === "idle" || status === "error";
    },
  },
);

/** Always succeeds on the surface: leaving must never leave the app stuck in a room. */
export const leaveRoom = createAsyncThunk<void, void, ThunkConfig>("chat/leaveRoom", async (_arg, { extra }) => {
  try {
    await extra.transport.leave();
  } catch (reason) {
    console.error("Leaving the room failed", reason);
  }
});

export const sendText = createAsyncThunk<ChatMessage, string, ThunkConfig>(
  "chat/sendText",
  async (text, { extra, rejectWithValue }) => {
    try {
      await extra.transport.send({ kind: "text", text });
      return { id: crypto.randomUUID(), from: "me", text, kind: "text", sentAt: Date.now() };
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "The message was not sent."));
    }
  },
  { condition: (_text, { getState }) => getState().chat.status === "joined" },
);

export const sendSticker = createAsyncThunk<ChatMessage, string, ThunkConfig>(
  "chat/sendSticker",
  async (glyph, { extra, rejectWithValue }) => {
    try {
      await extra.transport.send({ kind: "sticker", glyph });
      return { id: crypto.randomUUID(), from: "me", text: glyph, kind: "sticker", sentAt: Date.now() };
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "The sticker was not sent."));
    }
  },
  { condition: (_glyph, { getState }) => getState().chat.status === "joined" },
);

/** Validates the name, keeps it, and tells the room. Telling the room is best effort. */
export const changeName = createAsyncThunk<string, string, ThunkConfig>(
  "chat/changeName",
  async (name, { extra, getState, rejectWithValue }) => {
    const checked = validateMessage({ v: PROTOCOL_VERSION, kind: "hello", name });
    if (!checked.ok) return rejectWithValue(checked.reason);
    if (checked.message.kind !== "hello") return rejectWithValue("That is not a valid name.");
    const clean = checked.message.name;
    if (getState().chat.status === "joined") {
      try {
        await extra.transport.send({ kind: "hello", name: clean });
      } catch (reason) {
        console.error("Could not announce the new name", reason);
      }
    }
    return clean;
  },
);

/** Introduces you to a peer who just connected. A failure here is not worth showing. */
export const greetPeer = createAsyncThunk<void, string, ThunkConfig>(
  "chat/greetPeer",
  async (peerId, { extra, getState }) => {
    try {
      await extra.transport.send({ kind: "hello", name: getState().chat.myName }, peerId);
    } catch (reason) {
      console.error("Could not greet a peer", reason);
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState: createInitialState,
  reducers: {
    peerJoined(state, action: PayloadAction<TransportPeer>) {
      const incoming = action.payload;
      const existing = state.peers.find((peer) => peer.id === incoming.id);
      if (existing) {
        // A returning peer keeps the name they already told us.
        existing.online = true;
        return;
      }
      state.peers.push({ id: incoming.id, name: incoming.name, suffix: incoming.suffix, online: true });
    },
    peerLeft(state, action: PayloadAction<string>) {
      const peer = state.peers.find((entry) => entry.id === action.payload);
      if (peer) peer.online = false;
    },
    peerRenamed(state, action: PayloadAction<{ id: string; name: string }>) {
      const peer = state.peers.find((entry) => entry.id === action.payload.id);
      if (peer) peer.name = action.payload.name;
    },
    messageReceived(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    transportErrored(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    errorDismissed(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinRoom.pending, (state) => {
        state.status = "joining";
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.status = "joined";
        state.roomCode = action.payload;
        state.error = null;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Could not join the room.";
      })
      .addCase(leaveRoom.fulfilled, (state) => ({ ...createInitialState(), myName: state.myName }))
      .addCase(sendText.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendSticker.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendText.rejected, (state, action) => {
        if (action.payload) state.error = action.payload;
      })
      .addCase(sendSticker.rejected, (state, action) => {
        if (action.payload) state.error = action.payload;
      })
      .addCase(changeName.fulfilled, (state, action) => {
        state.myName = action.payload;
        state.error = null;
      })
      .addCase(changeName.rejected, (state, action) => {
        if (action.payload) state.error = action.payload;
      });
  },
});

export const { peerJoined, peerLeft, peerRenamed, messageReceived, transportErrored, errorDismissed } =
  chatSlice.actions;
export default chatSlice.reducer;