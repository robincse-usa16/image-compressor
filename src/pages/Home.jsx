import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

const Home = () => {
  return (
    <div className="container">
      <h1>Welcome to ImageTools</h1>
      <p className="subtitle">Your all-in-one solution for image processing</p>

      <div className="tool-cards">
        <Link to="/compressor" className="tool-card">
          <div className="tool-icon">📉</div>
          <h3>Image Compressor</h3>
          <p>Reduce image file sizes without losing quality</p>
        </Link>

        <Link to="/converter" className="tool-card">
          <div className="tool-icon">🔄</div>
          <h3>Image Converter</h3>
          <p>Convert between different image formats</p>
        </Link>

        <Link to="/tools" className="tool-card">
          <div className="tool-icon">🧰</div>
          <h3>More Tools</h3>
          <p>Explore our collection of image tools</p>
        </Link>
        <Link to="/resizer" className="tool-card">
          <div className="tool-icon">🧰</div>
          <h3>Image Resizer</h3>
          <p>Explore our collection of image resize tools</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;
