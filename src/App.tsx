import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Detect from "@/pages/Detect";
import Monitor from "@/pages/Monitor";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
