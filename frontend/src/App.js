import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import TitleBar from "./components/TitleBar";
import Footer from "./components/Footer";
import "./App.css";

// Load background image (Fix applied)
const backgroundImage = require("./assets/img.jpg");

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Accuracy = lazy(() => import("./pages/Accuracy"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <div
      className="app-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TitleBar />

      <div className="content">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accuracy" element={<Accuracy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

export default App;
