import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FaSpinner, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Banner from '../components/Banner';
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
  const [searchType, setSearchType] = useState('all');
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}&type=${searchType}`);
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
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <Banner />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search Bar with Options */}
        <div className="mb-16">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className={`flex-grow p-2 rounded-t-md sm:rounded-l-md sm:rounded-t-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className={`p-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
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
              className={`p-2 rounded-b-md sm:rounded-r-md sm:rounded-b-none ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Feature Story */}
        {featureStory && (
          <div className="mb-16">
            <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Featured Story</h2>
            <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-[#90d2dc]'}`}>
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
                    className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-[#90d2dc]'}`}
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
