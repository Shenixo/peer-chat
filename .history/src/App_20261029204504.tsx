import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Room from "./pages/Room";
import Chat from "./pages/Chat";
import Files from "./pages/Files";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/files" element={<Files />} />
      </Route>
    </Routes>
  );
};

export default App;