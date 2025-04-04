import React from "react";
import { Link } from "react-router-dom";
import "./TitleBar.css";

function TitleBar() {
  return (
    <div className="title-bar">
      <h1 className="title">Audio Deepfake Detection</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/accuracy">Accuracy</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

export default TitleBar;
