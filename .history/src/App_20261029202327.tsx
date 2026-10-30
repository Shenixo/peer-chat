import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Room from "./pages/Room";
import Chat from "./pages/Chat";

const App = () => {
  return (
    <div className="p-6">
      <Layout />
      <Routes>
        <Route path="/" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </div>
  );
};

export default App;
