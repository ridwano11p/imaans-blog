// src/pages/Home.js

import React, { useState, useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { FaSpinner, FaSearch, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaPlay } from 'react-icons/fa';
import StorageInfo from '../components/StorageInfo';
import { motion, AnimatePresence } from 'framer-motion';

const BlogPost = ({ post, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadMedia = () => {
      if (post.imageUrl) {
        const img = new Image();
        img.onload = () => setImageAspectRatio(img.width / img.height);
        img.src = post.imageUrl;
      }
    };

    loadMedia();
  }, [post.imageUrl]);

  const containerStyle = post.imageUrl && post.videoUrl
    ? 'max-w-4xl'
    : 'max-w-2xl';

  const imageStyle = imageAspectRatio
    ? { paddingBottom: `${(1 / imageAspectRatio) * 100}%` }
    : { paddingBottom: '56.25%' }; // Default to 16:9 aspect ratio

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mb-12 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} ${containerStyle} mx-auto`}
    >
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>{post.title}</h2>
        <p className={`text-sm mb-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>By {post.author}</p>
        <p className={`text-sm mb-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.date}</p>

        <div className="flex flex-col md:flex-row md:space-x-4 mb-4 justify-center items-center">
          {post.imageUrl && (
            <div className={`w-full ${post.videoUrl ? 'md:w-1/2' : ''} mb-4 md:mb-0`}>
              <div className="relative w-full" style={imageStyle}>
                <img
                  src={post.imageUrl}
                  alt="Blog post"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          )}
          {post.videoUrl && (
            <div className={`w-full ${post.imageUrl ? 'md:w-1/2' : ''}`}>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <video
                  ref={videoRef}
                  controls
                  className="absolute top-0 left-0 w-full h-full object-contain rounded-lg"
                >
                  <source src={post.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </div>

        <p className={`mb-4 text-center ${expanded ? '' : 'line-clamp-3'} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
        <div className="flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}
          >
            {expanded ? 'Read Less' : 'Read More'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);

  const blogsPerPage = 4;
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let q;
      if (searchTerm.trim()) {
        const searchTermLower = searchTerm.toLowerCase();
        q = query(
          collection(db, 'blogs'),
          where('titleLower', '>=', searchTermLower),
          where('titleLower', '<=', searchTermLower + '\uf8ff'),
          orderBy('titleLower'),
          limit(blogsPerPage)
        );
      } else {
        q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(blogsPerPage));
        if (lastVisible && currentPage > 1) {
          q = query(q, startAfter(lastVisible));
        }
      }

      const querySnapshot = await getDocs(q);
      const fetchedBlogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBlogs(fetchedBlogs);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

      if (!searchTerm.trim()) {
        const totalDocs = await getDocs(query(collection(db, 'blogs')));
        setTotalPages(Math.ceil(totalDocs.size / blogsPerPage));
      } else {
        setTotalPages(1); // For search results, we'll just show one page
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching blogs: ", err);
      setError("Failed to fetch blogs. Please try again later.");
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setCurrentPage(1);
    await fetchBlogs();
    setSearching(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded ${
            i === currentPage
              ? darkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : darkMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`mx-1 px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`mx-1 px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaChevronLeft />
        </button>
        {pageNumbers}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`mx-1 px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaChevronRight />
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`mx-1 px-2 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400 ' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          Imaan's Blog
        </motion.h1>

        <div className="mb-8 flex flex-col items-center justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-3xl flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search blogs..."
              ref={searchInputRef}
              className={`flex-grow px-4 py-2 rounded-l-md focus:outline-none ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-900 border-gray-300'
              } border`}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded-r-md ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition duration-300 flex items-center`}
            >
              {searching ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSearch className="mr-2" />
              )}
              Search
            </button>
          </form>
          <div className="mt-4">
            <StorageInfo />
          </div>
        </div>

        <AnimatePresence>
          {blogs.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-center text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              No blogs found. {user ? 'Create your first blog!' : 'Login to create a blog!'}
            </motion.p>
          ) : (
            blogs.map((post) => (
              <BlogPost key={post.id} post={post} darkMode={darkMode} />
            ))
          )}
        </AnimatePresence>

        {renderPagination()}
      </div>
    </div>
  );
};

export default Home;
