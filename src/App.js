import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Compressor from "./pages/Compressor";
import Converter from "./pages/Converter";
import Tools from "./pages/Tools";
import Account from "./pages/Account";
import "./App.css";
import Resizer from "./pages/Resizer";

function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compressor" element={<Compressor />} />
          <Route path="/converter" element={<Converter />} />
          <Route path="/resizer" element={<Resizer />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
