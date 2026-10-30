export const motionTokens = {
  duration: {
    fast: 0.15,
    base: 0.25,
    exit: 0.2,
  },
  ease: {
    enter: [0.16, 1, 0.3, 1],
    standard: [0.4, 0, 0.2, 1],
  },
  spring: {
    snappy: { type: "spring", stiffness: 520, damping: 34, mass: 1 },
    smooth: { type: "spring", stiffness: 260, damping: 30, mass: 1 },
  },
} as const;


Peer Chat: Handoff 2
Updated October 29, 2026, for Abdulrazaq Olaseni Disu (Olaseni, called Sheni in the first handoff). Paste this whole document at the start of any new session (Claude chat or Claude Code) so the context carries over. It replaces the first handoff.
1. Why we are building this
Olaseni is applying for frontend roles, including Tether's Keet Desktop role (React on the Pear peer to peer runtime). His CV shows strong React and TypeScript, but nothing on peer to peer technology, automated testing, desktop apps, or real-time media. This project is a small, finishable piece of evidence for those gaps: a desktop chat app where two people message and share files directly, with no chat server in the middle.
The project is separate from his 