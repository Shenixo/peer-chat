export type Peer = {
  id: string;
  name: string;
  online: boolean;
};

export type ChatMessage = {
  id: string;
  from: "me" | "peer";
  text: string;
  sentAt: number;
};