import { useState } from "react";
import Navbar from '../components/Navbar'
type Screen = "room" | "chat" | "transfers";
const [screen, setScreen] = useState<Screen>("room");

const Room = () => {
  return (
    <div>
    </div>
  )
}

export default Room
