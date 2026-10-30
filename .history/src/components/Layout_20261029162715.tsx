import { useState } from "react";
import Navbar from '../components/Navbar'
type Screen = "room" | "chat" | "transfers";
const [screen, setScreen] = useState<Screen>("room");

const Layout = () => {
  return (
      <div>
       <Navbar active={screen} onChange={setScreen} peerCount={0} />
          
    </div>
  )
}

export default Layout