import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import VideoPlayer from '../components/VideoPlayer';

const MediaContent = ({ imageUrl, videoUrl, isYouTubeVideo, title }) => {
  const containerClasses = "w-full aspect-square md:aspect-video bg-black flex items-center justify-center overflow-hidden";
  const mediaClasses = "w-full h-full object-contain";

  if (imageUrl && videoUrl) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={containerClasses}>
          <img src={imageUrl} alt={title} className={mediaClasses} />
        </div>
        <div className={containerClasses}>
          <VideoPlayer
            videoUrl={videoUrl}
            isYouTubeVideo={isYouTubeVideo}
          />
        </div>
      </div>
    );
  } else if (videoUrl) {
    return (
      <div className={containerClasses}>
        <VideoPlayer
          videoUrl={videoUrl}
          isYouTubeVideo={isYouTubeVideo}
        />
      </div>
    );
  } else if (imageUrl) {
    return (
      <div className={containerClasses}>
        <img src={imageUrl} alt={title} className={mediaClasses} />
      </div>
    );
  }
  return null;
};

const BlogPost = ({ post, darkMode, onTagClick }) => {
  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, content.lastIndexOf(' ', maxLength)) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mb-12 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-4xl mx-auto`}
    >
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>{post.title}</h2>
        <p className={`text-sm mb-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>By {post.author}</p>
        <p className={`text-sm mb-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.date}</p>

        <div className="mb-4">
          <MediaContent
            imageUrl={post.imageUrl}
            videoUrl={post.videoUrl}
            isYouTubeVideo={post.isYouTubeVideo}
            title={post.title}
          />
        </div>

        <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <p>{truncateContent(post.content)}</p>
        </div>
        <div className="mb-4">
          {post.tags && post.tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={`inline-block px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 cursor-pointer ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            to={`/article/${post.id}`}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}
          >
            Read More
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const ImpactStories = () => {
  const { darkMode } = useContext(ThemeContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [firstDoc, setFirstDoc] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const navigate = useNavigate();

  const blogsPerPage = 4;

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let q;
      if (currentPage === 1) {
        q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(blogsPerPage));
      } else if (currentPage > 1) {
        q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(blogsPerPage));
      }

      const querySnapshot = await getDocs(q);
      const fetchedBlogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBlogs(fetchedBlogs);
      setFirstDoc(querySnapshot.docs[0]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

      // Calculate total pages
      const totalBlogsQuery = await getDocs(collection(db, 'blogs'));
      const totalBlogs = totalBlogsQuery.size;
      setTotalPages(Math.ceil(totalBlogs / blogsPerPage));

      setLoading(false);
    } catch (err) {
      console.error("Error fetching blogs: ", err);
      setError("Failed to fetch blogs. Please try again later.");
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handleTagClick = (tag) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const renderPageNumbers = () => {
    let pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded ${
            i === currentPage
              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
              : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
          }`}
        >
          {i}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-5xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Impact Stories
        </h1>

        <AnimatePresence>
          {blogs.map((post) => (
            <BlogPost key={post.id} post={post} darkMode={darkMode} onTagClick={handleTagClick} />
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center items-center mt-8">
            <FaSpinner className={`animate-spin text-4xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
          </div>
        )}

        {error && (
          <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaArrowLeft />
            </button>
            {renderPageNumbers()}
            <button
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactStories;