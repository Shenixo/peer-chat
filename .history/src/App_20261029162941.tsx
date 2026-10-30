import Layout from "./components/Layout";
import Room from "./pages/Room";

const App = () => {
  return (
    <div className="p-6">
      <Layout />
      <Room/>
      <h1 className="mt-6 text-2xl font-semibold">This is the peer chat app</h1>
    </div>
  );
};

export default App;
