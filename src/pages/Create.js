import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { getContentExistence } from '../utils/contentChecks';

const CreateOption = ({ title, description, link, disabled }) => {
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

const Create = () => {
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
          Create New Content
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateOption
            title="Create Blog Post"
            description="Write a new blog post for Impact Stories."
            link="/create/blog"
          />
          <CreateOption
            title="Create Feature Story"
            description="Create a new feature story for the homepage."
            link="/create/feature-story"
            disabled={contentExists['Feature Story']}
          />
          <CreateOption
            title="Add Team Member"
            description="Add a new team member to the 'Who We Are' section."
            link="/create/team-member"
          />
          <CreateOption
            title="Add Video"
            description="Upload a new video or add a YouTube link."
            link="/create/video"
          />
          <CreateOption
            title="Create 'What We Do' Info"
            description="Add new information to the 'What We Do' section."
            link="/create/what-we-do"
            disabled={contentExists['What We Do']}
          />
          <CreateOption
            title="Upload PDF"
            description="Upload a new PDF for the Research and Reports section."
            link="/create/pdf"
          />
          <CreateOption
            title="Add Photo"
            description="Upload a new photo for the Gallery section."
            link="/create/photo"
          />
          <CreateOption
            title="Create Contact Info"
            description="Add contact information for the Contact Us page."
            link="/create/contact-info"
          />
          <CreateOption
            title="Create Banner"
            description="Create a new banner for the homepage."
            link="/create/banner"
            disabled={contentExists['Banner']}
          />
        </div>
      </div>
    </div>
  );
};

export default Create;