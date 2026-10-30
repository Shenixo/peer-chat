import { useState } from "react";
import Navbar from '../components/Navbar'
type Screen = "room" | "chat" | "transfers";

const Room = () => {
    const [screen, setScreen] = useState<Screen>("room");
  return (
    <div>
    </div>
  )
}

export default Room
