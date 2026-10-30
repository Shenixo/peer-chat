import { useState } from "react";
import Navbar from "./components/Navbar";
import Navbar from '../components/Navbar'
type Screen = "room" | "chat" | "transfers";

const Room = () => {
    const [screen, setScreen] = useState<Screen>("room");
  return (
    <div>
       <Navbar active={screen} onChange={setScreen} peerCount={0} />
    </div>
  )
}

export default Room
