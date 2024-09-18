import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import Home from '../pages/Home';
import ImpactStories from '../pages/ImpactStories';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Create from '../pages/Create';
import Edit from '../pages/Edit';
import PrivateRoute from './PrivateRoute';

// About Us pages
import WhoWeAre from '../pages/About/WhoWeAre';
import WhatWeDo from '../pages/About/WhatWeDo';

// Documentaries pages
import Videos from '../pages/Documentaries/Videos';

// Research and Reports pages
import PDFs from '../pages/Research/PDFs';

// Gallery pages
import Photos from '../pages/Gallery/Photos';

// Create pages
import CreateBlog from '../pages/CreatePages/CreateBlog';
import CreateTeamMember from '../pages/CreatePages/CreateTeamMember';
import CreateVideo from '../pages/CreatePages/CreateVideo';
import CreateWhatWeDo from '../pages/CreatePages/CreateWhatWeDo';
import CreatePDF from '../pages/CreatePages/CreatePDF';
import CreatePhoto from '../pages/CreatePages/CreatePhoto';
import CreateContactInfo from '../pages/CreatePages/CreateContactInfo';
import CreateBanner from '../pages/CreatePages/CreateBanner';

// Edit pages
import EditBlog from '../pages/EditPages/EditBlog';
import EditTeamMember from '../pages/EditPages/EditTeamMember';
import EditVideo from '../pages/EditPages/EditVideo';
import EditWhatWeDo from '../pages/EditPages/EditWhatWeDo';
import EditPDF from '../pages/EditPages/EditPDF';
import EditPhoto from '../pages/EditPages/EditPhoto';
import EditContactInfo from '../pages/EditPages/EditContactInfo';
import EditBanner from '../pages/EditPages/EditBanner';

const AppNavigator = () => {
  return (
    <Router basename="/imaans-blog">
      <NavBar />
      <Routes>
        <Route path="/" element={<><Home /><Footer /></>} />
        <Route path="/about/who-we-are" element={<><WhoWeAre /><Footer /></>} />
        <Route path="/about/what-we-do" element={<><WhatWeDo /><Footer /></>} />
        <Route path="/impact-stories" element={<><ImpactStories /><Footer /></>} />
        <Route path="/documentaries/videos" element={<><Videos /><Footer /></>} />
        <Route path="/research/pdfs" element={<><PDFs /><Footer /></>} />
        <Route path="/gallery/photos" element={<><Photos /><Footer /></>} />
        <Route path="/contact" element={<><Contact /><Footer /></>} />
        <Route path="/login" element={<><Login /><Footer /></>} />
        <Route path="/create" element={
          <PrivateRoute>
            <Create />
            <Footer />
          </PrivateRoute>
        } />
        <Route path="/edit" element={
          <PrivateRoute>
            <Edit />
            <Footer />
          </PrivateRoute>
        } />
        {/* Create Routes */}
        <Route path="/create/blog" element={
          <PrivateRoute>
            <CreateBlog />
          </PrivateRoute>
        } />
        <Route path="/create/team-member" element={
          <PrivateRoute>
            <CreateTeamMember />
          </PrivateRoute>
        } />
        <Route path="/create/video" element={
          <PrivateRoute>
            <CreateVideo />
          </PrivateRoute>
        } />
        <Route path="/create/what-we-do" element={
          <PrivateRoute>
            <CreateWhatWeDo />
          </PrivateRoute>
        } />
        <Route path="/create/pdf" element={
          <PrivateRoute>
            <CreatePDF />
          </PrivateRoute>
        } />
        <Route path="/create/photo" element={
          <PrivateRoute>
            <CreatePhoto />
          </PrivateRoute>
        } />
        <Route path="/create/contact-info" element={
          <PrivateRoute>
            <CreateContactInfo />
          </PrivateRoute>
        } />
        <Route path="/create/banner" element={
          <PrivateRoute>
            <CreateBanner />
          </PrivateRoute>
        } />
        {/* Edit Routes */}
        <Route path="/edit/blogs" element={
          <PrivateRoute>
            <EditBlog />
          </PrivateRoute>
        } />
        <Route path="/edit/team-members" element={
          <PrivateRoute>
            <EditTeamMember />
          </PrivateRoute>
        } />
        <Route path="/edit/videos" element={
          <PrivateRoute>
            <EditVideo />
          </PrivateRoute>
        } />
        <Route path="/edit/what-we-do" element={
          <PrivateRoute>
            <EditWhatWeDo />
          </PrivateRoute>
        } />
        <Route path="/edit/pdfs" element={
          <PrivateRoute>
            <EditPDF />
          </PrivateRoute>
        } />
        <Route path="/edit/photos" element={
          <PrivateRoute>
            <EditPhoto />
          </PrivateRoute>
        } />
        <Route path="/edit/contact-info" element={
          <PrivateRoute>
            <EditContactInfo />
          </PrivateRoute>
        } />
        <Route path="/edit/banner" element={
          <PrivateRoute>
            <EditBanner />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppNavigator;
