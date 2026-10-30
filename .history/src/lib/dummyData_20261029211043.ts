export type ActivityEvent = {
  id: string;
  text: string;
};

export const dummyEvents: ActivityEvent[] = [
  { id: "evt-01", text: "You created the room K7QM92XD" },
  { id: "evt-02", text: "Ada joined the room" },
  { id: "evt-03", text: "Connection to Ada is encrypted" },
  { id: "evt-04", text: "Ada changed their name to Ada L." },
  { id: "evt-05", text: "You changed your name to Olaseni" },
  { id: "evt-06", text: "Tunde joined the room" },
  { id: "evt-07", text: "Tunde left the room" },
  { id: "evt-08", text: "Ada reconnected" },
  { id: "evt-09", text: "Ada is typing" },
  { id: "evt-10", text: "Ada sent a message" },
  { id: "evt-11", text: "You sent a message" },
  { id: "evt-12", text: "Ada left the room" },
];