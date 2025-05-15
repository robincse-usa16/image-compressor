import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🖼️</span>
          <span className="logo-text">ImageTools</span>
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/compressor" className="nav-links">
              Compressor
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/converter" className="nav-links">
              Converter
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/resizer" className="nav-links">
              Image Resizer
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/tools" className="nav-links">
              More Tools
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/account" className="nav-links">
              Account
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
