import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { getContentExistence } from '../utils/contentChecks';

const EditOption = ({ title, description, link, disabled }) => {
  const { darkMode } = useContext(ThemeContext);

  if (disabled) {
    return (
      <div className={`block p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} opacity-50 cursor-not-allowed`}>
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
      </div>
    );
  }

  return (
    <Link to={link} className={`block p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition duration-300`}>
      <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
    </Link>
  );
};

const Edit = () => {
  const { darkMode } = useContext(ThemeContext);
  const [contentExists, setContentExists] = useState({});

  useEffect(() => {
    const fetchContentExistence = async () => {
      const existence = await getContentExistence();
      setContentExists(existence);
    };

    fetchContentExistence();
  }, []);

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit Content
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EditOption
            title="Edit Blog Posts"
            description="Edit or delete existing blog posts in Impact Stories."
            link="/edit/blogs"
          />
          <EditOption
            title="Edit Team Members"
            description="Update or remove team members from the 'Who We Are' section."
            link="/edit/team-members"
          />
          <EditOption
            title="Edit Videos"
            description="Update or remove videos from the Documentaries section."
            link="/edit/videos"
          />
          <EditOption
            title="Edit 'What We Do' Info"
            description="Update information in the 'What We Do' section."
            link="/edit/what-we-do"
            disabled={!contentExists['What We Do']}
          />
          <EditOption
            title="Edit PDFs"
            description="Update or remove PDFs from the Research and Reports section."
            link="/edit/pdfs"
          />
          <EditOption
            title="Edit Photos"
            description="Update or remove photos from the Gallery section."
            link="/edit/photos"
          />
          <EditOption
            title="Edit Contact Info"
            description="Update contact information for the Contact Us page."
            link="/edit/contact-info"
          />
        </div>
      </div>
    </div>
  );
};

export default Edit;