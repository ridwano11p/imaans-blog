import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { FaSearch } from 'react-icons/fa';

const Search = () => {
  const { darkMode } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}&type=${searchType}`);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-semibold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Search Our Content
        </h1>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter your search term"
            className={`flex-grow p-3 rounded-t-md sm:rounded-l-md sm:rounded-t-none ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className={`p-3 ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            } border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
          >
            <option value="all">All</option>
            <option value="blogs">Blogs</option>
            <option value="featureStories">Feature Stories</option>
            <option value="photos">Images</option>
            <option value="videos">Videos</option>
            <option value="pdfs">PDFs</option>
            <option value="team_members">Team Members</option>
          </select>
          <button
            type="submit"
            className={`p-3 rounded-b-md sm:rounded-r-md sm:rounded-b-none ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition duration-300`}
          >
            <FaSearch className="inline mr-2" />
            Search
          </button>
        </form>
        <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>Use the search bar above to find content across our website.</p>
          <p>You can search for blogs, feature stories, images, videos, PDFs, and team members.</p>
        </div>
      </div>
    </div>
  );
};

export default Search;