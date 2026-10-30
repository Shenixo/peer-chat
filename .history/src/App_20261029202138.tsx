import { Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Room from "./pages/Room";

const App = () => {
  return (
    <div className="p-6">
      <Layout />
     <Routes element={ <Room/>}/>
    </div>
  );
};

export default App;
