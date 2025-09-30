import React from "react";
import { Routes, Route } from "react-router-dom";
import ForgotPassword from "./pages/Auth/ForgotPassword";
// import Login from "./pages/Auth/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // required for styles
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Microscopy from "./pages/Microscopy";
import MicroscopyReport from "./pages/MicroscopyReport";
import QCData from "./pages/QCData";
import PatientManagement from "./pages/PatientManagement";
import CampManagement from "./pages/CampManagement";
import MicroscopeTestManagement from "./pages/MicroscopeTestManagement";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Default route */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/microscopy" element={<Microscopy />} />
        {/* Individual patient test page */}
          <Route path="/microscope-test/:reportId" element={<MicroscopeTestManagement />} />
          
          {/* Test management page - shows test-based reports */}
          <Route path="/test-management" element={<MicroscopeTestManagement />} />
          
          {/* Individual microscopy report editing page */}
          <Route path="/microscopy-report/:reportId" element={<MicroscopyReport />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/patients" element={<PatientManagement />} />
        <Route path="/camps" element={<CampManagement />} />
        <Route path="/qc-data" element={<QCData />} />
        <Route path="/profile" element={<Profile />} />
        {/* <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<NotFound />} /> 404 route */}
      </Routes>

      {/* Toast Container must be outside Routes */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
      
  );
};

export default App;
