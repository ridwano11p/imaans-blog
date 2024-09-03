import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './NavBar';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import CreateBlog from '../pages/CreateBlog';
import EditBlogs from '../pages/EditBlogs';
import EditAbout from '../pages/EditAbout';
import PrivateRoute from './PrivateRoute';

const AppNavigator = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-blog" element={
          <PrivateRoute>
            <CreateBlog />
          </PrivateRoute>
        } />
        <Route path="/edit-blogs" element={
          <PrivateRoute>
            <EditBlogs />
          </PrivateRoute>
        } />
        <Route path="/edit-about" element={
          <PrivateRoute>
            <EditAbout />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppNavigator;
