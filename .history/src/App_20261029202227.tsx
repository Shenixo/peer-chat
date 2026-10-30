import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Room from "./pages/Room";

const App = () => {
  return (
    <div className="p-6">
      <Layout />
      <Routes>
        <Route path="/" element={<Room />} />
        <Route path="/" element={<Room />} />
        <Route path="/" element={<Room />} />
      </Routes>
    </div>
  );
};

export default App;
