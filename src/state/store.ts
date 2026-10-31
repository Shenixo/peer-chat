import { configureStore } from "@reduxjs/toolkit";
import { peerSuffix } from "../transport/ChatTransport";
import type { ChatTransport, FileEvent, Unsubscribe } from "../transport/ChatTransport";
import chatReducer, {
  greetPeer,
  messageReceived,
  peerJoined,
  peerLeft,
  peerRenamed,
  transportErrored,
} from "./chatSlice";
import transfersReducer, {
  requestReceived,
  transferCancelled,
  transferCompleted,
  transferFailed,
  transferProgressed,
} from "./transfersSlice";

/**
 * Builds the store around one transport and wires the transport's events into it.
 * Call dispose() when the app shuts down so no handler outlives the store.
 */
export function createAppStore(transport: ChatTransport) {
  const store = configureStore({
    reducer: { chat: chatReducer, transfers: transfersReducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: { transport } } }),
  });

  const findPeer = (peerId: string) => store.getState().chat.peers.find((peer) => peer.id === peerId);

  function handleFileEvent(event: FileEvent) {
    const at = Date.now();
    switch (event.type) {
      case "offered": {
        const peer = findPeer(event.peerId);
        store.dispatch(
          requestReceived({
            id: event.transferId,
            fileName: event.name,
            size: event.size,
            fromName: peer?.name ?? "Someone",
            fromSuffix: peer?.suffix ?? peerSuffix(event.peerId),
          }),
        );
        break;
      }
      case "accepted":
        break;
      case "declined":
        store.dispatch(transferFailed({ id: event.transferId, reason: "They declined the file.", at }));
        break;
      case "progress":
        store.dispatch(transferProgressed({ id: event.transferId, transferred: event.transferred, size: event.size }));
        break;
      case "completed":
        store.dispatch(transferCompleted({ id: event.transferId, at }));
        break;
      case "failed":
        store.dispatch(transferFailed({ id: event.transferId, reason: event.reason, at }));
        break;
      case "cancelled":
        store.dispatch(transferCancelled(event.transferId));
        break;
    }
  }

  const subscriptions: Unsubscribe[] = [
    transport.onPeerChange((event) => {
      if (event.type === "joined") {
        store.dispatch(peerJoined(event.peer));
        void store.dispatch(greetPeer(event.peer.id));
      } else {
        store.dispatch(peerLeft(event.peerId));
      }
    }),
    transport.onMessage(({ peerId, message, receivedAt }) => {
      if (message.kind === "hello") {
        store.dispatch(peerRenamed({ id: peerId, name: message.name }));
        return;
      }
      store.dispatch(
        messageReceived({
          id: crypto.randomUUID(),
          from: "peer",
          peerId,
          text: message.kind === "text" ? message.text : message.glyph,
          kind: message.kind,
          sentAt: receivedAt,
        }),
      );
    }),
    transport.onError((error) => {
      store.dispatch(transportErrored(error.message));
    }),
  ];
  const stopFiles = transport.files?.onFile(handleFileEvent);
  if (stopFiles) subscriptions.push(stopFiles);

  function dispose() {
    subscriptions.forEach((stop) => stop());
    subscriptions.length = 0;
  }

  return { store, dispose };
}

export type AppStore = ReturnType<typeof createAppStore>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];