import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import VideoPlayer from '../components/VideoPlayer';

const BlogPost = ({ post, darkMode }) => {
  const [expanded, setExpanded] = useState(false);

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

        {post.imageUrl && (
          <img src={post.imageUrl} alt="Blog post" className="w-full h-64 object-cover mb-4 rounded-lg" />
        )}

        {post.videoUrl && (
          <div className="mb-4">
            <VideoPlayer videoUrl={post.videoUrl} isYouTubeVideo={post.isYouTubeVideo} />
          </div>
        )}

        <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <p className={`${expanded ? '' : 'line-clamp-3'}`}>{post.content}</p>
        </div>
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

const ImpactStories = () => {
  const { darkMode } = useContext(ThemeContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const blogsPerPage = 5;

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(blogsPerPage));
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      const fetchedBlogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBlogs(prevBlogs => [...prevBlogs, ...fetchedBlogs]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === blogsPerPage);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching blogs: ", err);
      setError("Failed to fetch blogs. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-5xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Impact Stories
        </h1>

        <AnimatePresence>
          {blogs.map((post) => (
            <BlogPost key={post.id} post={post} darkMode={darkMode} />
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

        {!loading && !error && hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={fetchBlogs}
              className={`px-6 py-3 rounded-md ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition duration-300`}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactStories;