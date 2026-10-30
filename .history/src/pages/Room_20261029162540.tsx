import React from 'react'
import Navbar from '../components/Navbar'

const Room = () => {
  return (
    <div>
       <Navbar active={screen} onChange={setScreen} peerCount={0} />
    </div>
  )
}

export default Room
