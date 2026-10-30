import React from 'react'

const Room = () => {
  return (
    <div>
       <Navbar active={screen} onChange={setScreen} peerCount={0} />
    </div>
  )
}

export default Room
