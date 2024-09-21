import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { FaSpinner, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Banner from '../components/Banner';
import VideoPlayer from '../components/VideoPlayer';

const MediaContent = ({ imageUrl, videoUrl, isYouTubeVideo, title }) => {
  if (imageUrl && videoUrl) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full bg-black flex items-center justify-center aspect-w-16 aspect-h-9">
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="w-full aspect-w-16 aspect-h-9">
          <VideoPlayer
            videoUrl={videoUrl}
            isYouTubeVideo={isYouTubeVideo}
          />
        </div>
      </div>
    );
  } else if (videoUrl) {
    return (
      <div className="w-full aspect-w-16 aspect-h-9">
        <VideoPlayer
          videoUrl={videoUrl}
          isYouTubeVideo={isYouTubeVideo}
        />
      </div>
    );
  } else if (imageUrl) {
    return (
      <div className="w-full bg-black flex items-center justify-center aspect-w-16 aspect-h-9">
        <img 
          src={imageUrl} 
          alt={title} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }
  return null;
};

const formatContent = (content) => {
  return content.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-4">
      {paragraph}
    </p>
  ));
};

const Home = () => {
  const { darkMode } = useContext(ThemeContext);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [featureStory, setFeatureStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest blogs
        const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(5));
        const blogsSnapshot = await getDocs(blogsQuery);
        const blogs = blogsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLatestBlogs(blogs);

        // Fetch feature story
        const featureQuery = query(collection(db, 'featureStories'), orderBy('createdAt', 'desc'), limit(1));
        const featureSnapshot = await getDocs(featureQuery);
        if (!featureSnapshot.empty) {
          const featureData = featureSnapshot.docs[0].data();
          setFeatureStory({
            id: featureSnapshot.docs[0].id,
            ...featureData,
            tags: featureData.tags || [] // Ensure tags is always an array
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(null);
    if (!searchTerm.trim()) return;

    try {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const q = query(
        collection(db, 'blogs'),
        where('title', '>=', lowercaseSearchTerm),
        where('title', '<=', lowercaseSearchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No results found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Error searching blogs: ", err);
      setSearchError("An error occurred while searching. Please try again.");
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 4); // Now cycles through 4 slides (3 stories + 1 "Read More")
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 4) % 4); // Now cycles through 4 slides (3 stories + 1 "Read More")
  };

  const handleTagClick = (tag) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const renderLatestImpactStories = () => {
    if (currentSlide === 3) {
      // Render "Read More Stories" slide
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
          <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Discover More Impact Stories
          </h3>
          <Link 
            to="/impact-stories" 
            className={`inline-block px-6 py-3 rounded-md ${
              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
            } text-white transition duration-300`}
          >
            Read More Stories
          </Link>
        </div>
      );
    }

    const story = latestBlogs[currentSlide];
    return (
      <>
        <MediaContent
          imageUrl={story?.imageUrl}
          videoUrl={story?.videoUrl}
          isYouTubeVideo={story?.isYouTubeVideo}
          title={story?.title}
        />
        <div className="p-6">
          <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {story?.title}
          </h3>
          <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatContent(story?.content.substring(0, 200) + '...')}
          </div>
          <div className="mb-4">
            {story?.tags && story.tags.length > 0 ? (
              story.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`inline-block px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 cursor-pointer ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No tags available</p>
            )}
          </div>
          <Link 
            to={`/article/${story?.id}`} 
            className={`inline-block px-6 py-3 rounded-md ${
              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
            } text-white transition duration-300`}
          >
            Read More
          </Link>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Banner />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="mb-16">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search blogs..."
              className={`flex-grow p-2 rounded-l-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            />
            <button
              type="submit"
              className={`p-2 rounded-r-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <FaSearch />
            </button>
          </form>
          {searchError && <p className={`mt-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Search Results:</h3>
              <ul className="space-y-2">
                {searchResults.map(result => (
                  <li key={result.id}>
                    <Link
                      to={`/article/${result.id}`}
                      className={`block p-2 rounded ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                    >
                      {result.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Feature Story */}
        {featureStory && (
          <div className="mb-16">
            <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Featured Story</h2>
            <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <MediaContent
                imageUrl={featureStory.imageUrl}
                videoUrl={featureStory.videoUrl}
                isYouTubeVideo={featureStory.isYouTubeVideo}
                title={featureStory.title}
              />
              <div className="p-6">
                <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{featureStory.title}</h3>
                <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatContent(featureStory.content.substring(0, 200) + '...')}
                </div>
                <div className="mb-4">
                  {featureStory.tags && featureStory.tags.length > 0 ? (
                    featureStory.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`inline-block px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 cursor-pointer ${
                          darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No tags available</p>
                  )}
                </div>
                <Link to={`/article/${featureStory.id}`} className={`inline-block px-6 py-3 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition duration-300`}>
                  Read More
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Latest Impact Stories Slider */}
        {latestBlogs.length > 0 && (
          <div className="mb-16">
            <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Latest Impact Stories
            </h2>
            <div className="relative flex items-center">
              <button
                onClick={prevSlide}
                className="absolute left-0 z-10 -ml-12 bg-white rounded-full p-2 focus:outline-none shadow-md"
              >
                <FaChevronLeft size={24} className="text-green-600" />
              </button>
              <div className="w-full">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    {renderLatestImpactStories()}
                  </motion.div>
                </AnimatePresence>
              </div>
              <button
                onClick={nextSlide}
                className="absolute right-0 z-10 -mr-12 bg-white rounded-full p-2 focus:outline-none shadow-md"
              >
                <FaChevronRight size={24} className="text-green-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
