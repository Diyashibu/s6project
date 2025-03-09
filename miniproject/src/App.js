import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "../src/components/Admin";
import Teachers from "../src/components/teachers";
import Login from "../src/components/Login";
import Dashboard from "../src/components/Dashboard";
import Activity from "../src/components/Activity";
import Scholarship from "../src/components/Scholarship";

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Activity/>} />
      <Route path="/Login" element={<Login />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/Teachers" element={<Teachers />} />
        <Route path="/Dashboard" element={<Dashboard/>} />
        <Route path="/Activity" element={<Activity/>} />
        <Route path="/Scholarship" element={<Scholarship/>} />
      </Routes>
    </Router>
  );
}

export default App;
