import { useState } from "react";
import Navbar from '../components/Navbar'
type Screen = "room" | "chat" | "transfers";

const Layout = () => {
  const [, setScreen] = useState<Screen>("room");
  return (
      <div>
     <Navbar onChange={setScreen} peerCount={0} />
          
    </div>
  )
}

export default Layout