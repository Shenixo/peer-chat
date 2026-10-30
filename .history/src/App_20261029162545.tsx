import { useState } from "react";
import Navbar from "./components/Navbar";

type Screen = "room" | "chat" | "transfers";

const App = () => {


  return (
    <div className="p-6">
     
      <h1 className="mt-6 text-2xl font-semibold">This is the peer chat app</h1>
    </div>
  );
};

export default App;