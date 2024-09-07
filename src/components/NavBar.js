// src/components/NavBar.js

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { colors } from '../styles/colors';

const NavBar = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className={`bg-gradient-to-r ${darkMode ? colors.navbar.darkGradient : colors.navbar.lightGradient} p-4`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-white text-2xl font-bold mr-6">Imaan's Blog</Link>
          <div className="flex space-x-4">
            <Link to="/" className="text-white hover:text-gray-200">Home</Link>
            <Link to="/about" className="text-white hover:text-gray-200">About Us</Link>
            <Link to="/photos" className="text-white hover:text-gray-200">Photos</Link>
            <Link to="/videos" className="text-white hover:text-gray-200">Videos</Link>
            <Link to="/publications" className="text-white hover:text-gray-200">Publications</Link>
            {user && (
              <>
                <Link to="/create-blog" className="text-white hover:text-gray-200">Create Blog</Link>
                <Link to="/edit-blogs" className="text-white hover:text-gray-200">Edit Blogs</Link>
                <Link to="/edit-about" className="text-white hover:text-gray-200">Edit About Us</Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleDarkMode} className="text-white">
            {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-200"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="text-white hover:text-gray-200">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
