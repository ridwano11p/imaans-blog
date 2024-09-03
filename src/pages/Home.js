import React, { useState, useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { FaSpinner, FaDownload, FaSearch, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const BlogPost = ({ post, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    const loadMedia = () => {
      if (post.imageUrl) {
        const img = new Image();
        img.onload = () => setMediaAspectRatio(img.width / img.height);
        img.src = post.imageUrl;
      } else if (post.videoUrl && mediaRef.current) {
        mediaRef.current.addEventListener('loadedmetadata', () => {
          setMediaAspectRatio(mediaRef.current.videoWidth / mediaRef.current.videoHeight);
        });
      }
    };

    loadMedia();
  }, [post.imageUrl, post.videoUrl]);

  const handleDownload = async () => {
    try {
      const url = await getDownloadURL(ref(storage, post.pdfUrl));
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error downloading PDF: ", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const getPdfFileName = (url) => {
    if (!url) return '';
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1].split('?')[0];
  };

  const pdfFileName = getPdfFileName(post.pdfUrl);

  const mediaStyle = mediaAspectRatio
    ? { paddingBottom: `${(1 / mediaAspectRatio) * 100}%` }
    : { paddingBottom: '56.25%' }; // Default to 16:9 aspect ratio

  return (
    <div className={`mb-12 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {(post.imageUrl || post.videoUrl) && (
        <div className="relative w-full" style={mediaStyle}>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Blog post"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          )}
          {post.videoUrl && (
            <video
              ref={mediaRef}
              controls
              className="absolute top-0 left-0 w-full h-full object-contain"
            >
              <source src={post.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{post.title}</h2>
        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>By {post.author}</p>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.date}</p>
        <p className={`mb-4 ${expanded ? '' : 'line-clamp-3'} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}
          >
            {expanded ? 'Read Less' : 'Read More'}
          </button>
          {post.pdfUrl && (
            <div className="flex items-center">
              <span className={`mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{pdfFileName}</span>
              <button
                onClick={handleDownload}
                className={`flex items-center px-4 py-2 rounded ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition duration-300`}
              >
                <FaDownload className="mr-2" /> Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { theme, darkMode } = useContext(ThemeContext);
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

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let q;
      if (searchTerm) {
        q = query(
          collection(db, 'blogs'),
          where('title', '>=', searchTerm),
          where('title', '<=', searchTerm + '\uf8ff'),
          orderBy('title'),
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

      const totalDocs = await getDocs(query(collection(db, 'blogs')));
      setTotalPages(Math.ceil(totalDocs.size / blogsPerPage));

      setLoading(false);
    } catch (err) {
      console.error("Error fetching blogs: ", err);
      setError("Failed to fetch blogs. Please try again later.");
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setCurrentPage(1);
    await fetchBlogs();
    setSearching(false);
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
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: theme.background }}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: theme.background, color: theme.text }}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Imaan's Blog</h1>

        <div className="mb-8 flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blogs..."
            className={`flex-grow px-4 py-2 rounded-l-md focus:outline-none ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            } border`}
          />
          <button
            onClick={handleSearch}
            className={`px-4 py-2 rounded-r-md ${
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
        </div>

        {blogs.length === 0 ? (
          <p className={`text-center text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No blogs found. {user ? 'Create your first blog!' : 'Login to create a blog!'}
          </p>
        ) : (
          blogs.map((post) => (
            <BlogPost key={post.id} post={post} darkMode={darkMode} />
          ))
        )}

        {renderPagination()}
      </div>
    </div>
  );
};

export default Home;
