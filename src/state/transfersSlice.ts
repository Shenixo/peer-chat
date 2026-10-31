import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { EVERYONE, peerSuffix } from "../transport/ChatTransport";
import type { TransferItem, TransferRequest } from "../types";
import { errorMessage, leaveRoom } from "./chatSlice";
import type { ChatState, ThunkExtra } from "./chatSlice";

export type TransfersState = {
  /** Files peers want to send you. Nothing is saved until you accept. */
  requests: TransferRequest[];
  /** Newest first. */
  history: TransferItem[];
  savePath: string;
  /** Who the "Send to" list has selected: a peer id, or EVERYONE. */
  selectedRecipientId: string;
  error: string | null;
};

type TransfersThunkConfig = {
  state: { chat: ChatState; transfers: TransfersState };
  extra: ThunkExtra;
  rejectValue: string;
};

export const DEFAULT_SAVE_PATH = "Downloads/Peer Chat";
const NO_FILES = "This connection can't send files yet.";

const initialState: TransfersState = {
  requests: [],
  history: [],
  savePath: DEFAULT_SAVE_PATH,
  selectedRecipientId: EVERYONE,
  error: null,
};

function percent(transferred: number, size: number): number {
  if (size <= 0) return 100;
  return Math.min(100, Math.round((transferred / size) * 100));
}

const isActive = (item: TransferItem) => item.status === "sending" || item.status === "receiving";

/** Takes a request out of the waiting list and starts its row in the history. Restores the request if the peer cannot be told. */
export const acceptRequest = createAsyncThunk<void, string, TransfersThunkConfig>(
  "transfers/acceptRequest",
  async (id, { extra, getState, dispatch, rejectWithValue }) => {
    const files = extra.transport.files;
    if (!files) return rejectWithValue(NO_FILES);
    const request = getState().transfers.requests.find((entry) => entry.id === id);
    if (!request) return rejectWithValue("That request is no longer waiting.");

    // The row exists before the transport starts, so the first progress event has somewhere to land.
    dispatch(requestRemoved(id));
    dispatch(
      historyAdded({
        id,
        direction: "received",
        fileName: request.fileName,
        size: request.size,
        peerName: request.fromName,
        peerDetail: request.fromSuffix,
        status: "receiving",
        progress: 0,
        at: Date.now(),
      }),
    );
    try {
      await files.acceptFile(id);
    } catch (reason) {
      dispatch(transferCancelled(id));
      dispatch(requestReceived(request));
      return rejectWithValue(errorMessage(reason, "Could not accept the file."));
    }
  },
);

export const declineRequest = createAsyncThunk<void, string, TransfersThunkConfig>(
  "transfers/declineRequest",
  async (id, { extra, dispatch, rejectWithValue }) => {
    const files = extra.transport.files;
    if (!files) return rejectWithValue(NO_FILES);
    try {
      await files.declineFile(id);
      dispatch(requestRemoved(id));
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "Could not decline the file."));
    }
  },
);

/** Stops a transfer that is waiting or running, in either direction. */
export const cancelTransfer = createAsyncThunk<void, string, TransfersThunkConfig>(
  "transfers/cancelTransfer",
  async (id, { extra, rejectWithValue }) => {
    const files = extra.transport.files;
    if (!files) return rejectWithValue(NO_FILES);
    try {
      await files.cancelFile(id);
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "Could not cancel the transfer."));
    }
  },
);

/** Offers each file to one peer or to everyone. Each recipient gets its own row in the history. */
export const sendFiles = createAsyncThunk<void, { files: File[]; to: string }, TransfersThunkConfig>(
  "transfers/sendFiles",
  async ({ files, to }, { extra, getState, dispatch, rejectWithValue }) => {
    const transport = extra.transport.files;
    if (!transport) return rejectWithValue(NO_FILES);
    try {
      for (const file of files) {
        const started = await transport.offerFile(file, to);
        const { peers } = getState().chat;
        for (const { transferId, peerId } of started) {
          const peer = peers.find((entry) => entry.id === peerId);
          dispatch(
            historyAdded({
              id: transferId,
              direction: "sent",
              fileName: file.name,
              size: file.size,
              peerName: peer?.name ?? "Someone",
              peerDetail: peer?.suffix ?? peerSuffix(peerId),
              status: "sending",
              progress: 0,
              at: Date.now(),
            }),
          );
        }
      }
    } catch (reason) {
      return rejectWithValue(errorMessage(reason, "Could not send the file."));
    }
  },
);

const transfersSlice = createSlice({
  name: "transfers",
  initialState,
  reducers: {
    requestReceived(state, action: PayloadAction<TransferRequest>) {
      if (!state.requests.some((request) => request.id === action.payload.id)) state.requests.push(action.payload);
    },
    requestRemoved(state, action: PayloadAction<string>) {
      state.requests = state.requests.filter((request) => request.id !== action.payload);
    },
    historyAdded(state, action: PayloadAction<TransferItem>) {
      if (!state.history.some((item) => item.id === action.payload.id)) state.history.unshift(action.payload);
    },
    transferProgressed(state, action: PayloadAction<{ id: string; transferred: number; size: number }>) {
      const item = state.history.find((entry) => entry.id === action.payload.id);
      if (!item || !isActive(item)) return;
      item.progress = percent(action.payload.transferred, action.payload.size);
    },
    transferCompleted(state, action: PayloadAction<{ id: string; at: number }>) {
      const item = state.history.find((entry) => entry.id === action.payload.id);
      if (!item) return;
      item.status = "done";
      item.progress = 100;
      item.at = action.payload.at;
    },
    /** A running transfer stops where it was. A request that never started simply disappears. */
    transferFailed(state, action: PayloadAction<{ id: string; reason: string; at: number }>) {
      state.requests = state.requests.filter((request) => request.id !== action.payload.id);
      const item = state.history.find((entry) => entry.id === action.payload.id);
      if (!item || !isActive(item)) return;
      item.status = "stopped";
      item.reason = action.payload.reason;
      item.at = action.payload.at;
    },
    transferCancelled(state, action: PayloadAction<string>) {
      state.requests = state.requests.filter((request) => request.id !== action.payload);
      state.history = state.history.filter((item) => item.id !== action.payload);
    },
    historyCleared(state) {
      state.history = state.history.filter(isActive);
    },
    savePathChanged(state, action: PayloadAction<string>) {
      state.savePath = action.payload;
    },
    recipientSelected(state, action: PayloadAction<string>) {
      state.selectedRecipientId = action.payload;
    },
    errorDismissed(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Leaving the room drops anything still waiting. The history stays.
    builder.addCase(leaveRoom.fulfilled, (state) => {
      state.requests = [];
      state.selectedRecipientId = EVERYONE;
    });
    for (const thunk of [acceptRequest, declineRequest, cancelTransfer, sendFiles]) {
      builder.addCase(thunk.rejected, (state, action) => {
        if (action.payload) state.error = action.payload;
      });
    }
  },
});

export const {
  requestReceived,
  requestRemoved,
  historyAdded,
  transferProgressed,
  transferCompleted,
  transferFailed,
  transferCancelled,
  historyCleared,
  savePathChanged,
  recipientSelected,
  errorDismissed: transferErrorDismissed,
} = transfersSlice.actions;
export default transfersSlice.reducer;