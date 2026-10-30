# Peer Chat

A desktop chat app where two people message and share files directly, with no chat server in the middle.

> **Status: work in progress.** The interface is built and runs on placeholder data. The peer to peer connection is not built yet, so nothing is sent between devices today.

## The idea

Two people share a room code. Their apps find each other and talk straight to each other, so there is no account, no login and no hosted chat service in between. The project is a small, finishable piece of work to learn peer to peer networking, desktop apps and automated testing.

## What works today

- Room page: create or join a room (the buttons are not wired yet, and the room code is a demo value).
- Chat page: people list, message list and a composer with emoji and sticker pickers.
- Transfers page: choose who to send to, incoming file requests with Accept and Decline, a save location, and a history list with filters.
- Dark theme with one amber accent, bundled fonts (Inter and JetBrains Mono), animated components.

All of this uses dummy data. No messages or files leave your computer.

## What is not built yet

- The message module (encoding, decoding and validation) and its unit tests.
- The transport layer and a mock peer for development.
- The Redux store and wiring the pages to it.
- Real peer to peer connections with Pear and Hyperswarm, inside an Electron shell.
- Real file transfer, voice notes, saved history, installers.

## Tech stack

- React, TypeScript and Vite
- Tailwind CSS v4
- react-router-dom
- Motion and lucide-react
- UI components from [Arc UI](https://uiarc.dev), plus custom components

Planned: Redux Toolkit, Vitest, Electron, Pear and Hyperswarm.

## Run it locally

You need Node.js and npm.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Roadmap

1. Message module with unit tests.
2. Transport interface and a mock transport, including file offers and progress.
3. Redux store, and the pages wired to real state.
4. Real transport with Pear and Hyperswarm: two running copies exchange messages with no chat server.
5. Real file transfer with a progress view.
6. Tests for the desktop app, then installers.

## Privacy and honest limits

The goal is that messages travel encrypted straight between the two devices. That claim is not true yet, because the real connection does not exist, and it will only be stated here once it has been built and checked. Limits that will apply even then:

- The room code is the only door. Anyone who has it can join.
- There is no identity check. Display names are claims, not proof of who someone is.
- A direct connection reveals each person's network address to the other.

## License

Add a license here when you decide on one (MIT is a common choice for a portfolio project).