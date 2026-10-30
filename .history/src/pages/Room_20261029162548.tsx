import React from 'react'
import Navbar from '../components/Navbar'
  const [screen, setScreen] = useState<Screen>("room");
const Room = () => {
  return (
    <div>
       <Navbar active={screen} onChange={setScreen} peerCount={0} />
    </div>
  )
}

export default Room
