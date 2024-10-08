import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { FaSpinner, FaFile, FaImage, FaVideo, FaUser, FaPlay, FaExpand, FaFilePdf, FaDownload, FaLinkedin, FaFacebook, FaYoutube, FaTwitter, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '../components/VideoPlayer';
import { Img } from 'react-image';

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

const VideoCard = ({ video, darkMode, onPlay }) => {
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-4">
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{video.title}</h3>
        <div className="mb-4">
          <MediaContent
            videoUrl={video.videoUrl}
            isYouTubeVideo={video.isYouTube}
            title={video.title}
          />
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{video.description}</p>
      </div>
    </div>
  );
};

const PhotoCard = ({ photo, darkMode, onClick }) => {
  return (
    <div
      className={`relative rounded-lg shadow-md overflow-hidden cursor-pointer ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      onClick={() => onClick(photo)}
    >
      <div className="aspect-w-16 aspect-h-9">
        <Img
          src={photo.photoUrl}
          alt={photo.title}
          className="w-full h-full object-cover"
          loader={<div className="w-full h-full flex items-center justify-center bg-gray-200"><FaSpinner className="animate-spin text-4xl text-gray-400" /></div>}
          unloader={<div className="w-full h-full flex items-center justify-center bg-gray-200">Error loading image</div>}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50">
        <FaExpand className="text-white text-3xl" />
      </div>
      <div className="p-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {photo.title}
        </h3>
      </div>
    </div>
  );
};

const PhotoModal = ({ photo, darkMode, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200"
          >
            <FaTimes size={24} />
          </button>
          <Img
            src={photo.photoUrl}
            alt={photo.title}
            className="w-full h-auto"
            loader={<div className="w-full h-64 flex items-center justify-center"><FaSpinner className="animate-spin text-4xl text-gray-400" /></div>}
            unloader={<div className="w-full h-64 flex items-center justify-center">Error loading image</div>}
          />
        </div>
        <div className="p-4">
          <h3 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {photo.title}
          </h3>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{photo.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const PDFCard = ({ pdf, darkMode }) => {
  const handleViewPDF = () => {
    window.open(pdf.pdfUrl, '_blank');
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <FaFilePdf className={`text-4xl mr-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</h3>
        </div>
        <div 
          className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}
          dangerouslySetInnerHTML={{ __html: pdf.description }}
        />
        <button
          onClick={handleViewPDF}
          className={`inline-flex items-center px-4 py-2 rounded ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition duration-300`}
        >
          <FaDownload className="mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

const BlogCard = ({ blog, darkMode, onTagClick }) => {
  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, content.lastIndexOf(' ', maxLength)) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mb-12 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{blog.title}</h2>
        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>By {blog.author}</p>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{blog.date}</p>

        <div className="mb-4">
          <MediaContent
            imageUrl={blog.imageUrl}
            videoUrl={blog.videoUrl}
            isYouTubeVideo={blog.isYouTubeVideo}
            title={blog.title}
          />
        </div>

        <div className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <p>{truncateContent(blog.content)}</p>
        </div>
        <div className="mb-4">
          {blog.tags && blog.tags.map(tag => (
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
            to={`/article/${blog.id}`}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}
          >
            Read More
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const SocialMediaButton = ({ icon, link, darkMode }) => {
  if (!link) return null;
  
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-10 h-10 rounded-full ${
        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
      } transition duration-300`}
    >
      {icon}
    </a>
  );
};

const TeamMemberModal = ({ member, darkMode, onClose }) => {
  const socialMediaLinks = [
    { icon: <FaLinkedin />, link: member.linkedin },
    { icon: <FaFacebook />, link: member.facebook },
    { icon: <FaYoutube />, link: member.youtube },
    { icon: <FaTwitter />, link: member.twitter },
  ].filter(item => item.link);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`relative max-w-2xl w-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-gray-500`}
        >
          &times;
        </button>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0">
            <img src={member.imageUrl} alt={member.name} className="w-40 h-40 rounded-full mx-auto object-cover" />
          </div>
          <div className="md:w-2/3 md:pl-6">
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</h2>
            <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.role}</p>
            <div className={`mb-4 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.bio}</div>
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          {socialMediaLinks.length > 0 ? (
            socialMediaLinks.map((item, index) => (
              <SocialMediaButton key={index} icon={item.icon} link={item.link} darkMode={darkMode} />
            ))
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This team member has no social media links.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TeamMember = ({ member, darkMode, onOpenModal }) => {
  const truncatedBio = member.bio.length > 100 ? member.bio.substring(0, 100) + '...' : member.bio;

  return (
    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
      <h3 className={`text-xl font-semibold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</h3>
      <p className={`text-center mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.role}</p>
      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>{truncatedBio}</p>
      <button
        onClick={() => onOpenModal(member)}
        className={`w-full py-2 rounded ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition duration-300`}
      >
        More Info
      </button>
    </div>
  );
};

const SearchResults = () => {
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('q');
  const searchType = searchParams.get('type') || 'all';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        let collections = ['blogs', 'featureStories', 'photos', 'videos', 'pdfs', 'team_members'];
        if (searchType !== 'all') {
          collections = [searchType];
        }

        const normalizedSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, ' ').trim();
        let allResults = [];

        for (const collectionName of collections) {
          let q = query(
            collection(db, collectionName),
            orderBy(collectionName === 'team_members' ? 'name' : 'title'),
            limit(50)  // Increased limit to get more potential matches
          );

          const querySnapshot = await getDocs(q);
          const collectionResults = querySnapshot.docs.map(doc => ({
            id: doc.id,
            type: collectionName,
            ...doc.data()
          }));

          allResults = [...allResults, ...collectionResults];
        }

        // Perform case-insensitive filtering with normalized spaces
        allResults = allResults.filter(item => {
          const searchField = item.type === 'team_members' ? item.name : item.title;
          const normalizedField = searchField.toLowerCase().replace(/\s+/g, ' ').trim();
          return normalizedField.includes(normalizedSearchTerm);
        });

        // Sort results by relevance (exact matches first, then partial matches)
        allResults.sort((a, b) => {
          const aField = a.type === 'team_members' ? a.name : a.title;
          const bField = b.type === 'team_members' ? b.name : b.title;
          const aFieldNormalized = aField.toLowerCase().replace(/\s+/g, ' ').trim();
          const bFieldNormalized = bField.toLowerCase().replace(/\s+/g, ' ').trim();
          const aStartsWith = aFieldNormalized.startsWith(normalizedSearchTerm);
          const bStartsWith = bFieldNormalized.startsWith(normalizedSearchTerm);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return 0;
        });

        setResults(allResults);
        setLoading(false);
      } catch (err) {
        console.error("Error searching: ", err);
        setError("An error occurred while searching. Please try again.");
        setLoading(false);
      }
    };

    if (searchTerm) {
      fetchResults();
    }
  }, [searchTerm, searchType]);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
  };

  const handleTagClick = (tag) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  const openModal = (member) => {
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  const renderResultItem = (item) => {
    switch (item.type) {
      case 'blogs':
      case 'featureStories':
        return (
          <BlogCard
            blog={item}
            darkMode={darkMode}
            onTagClick={handleTagClick}
          />
        );
      case 'videos':
        return (
          <VideoCard
            video={item}
            darkMode={darkMode}
          />
        );
      case 'photos':
        return (
          <PhotoCard
            photo={item}
            darkMode={darkMode}
            onClick={handlePhotoClick}
          />
        );
      case 'pdfs':
        return (
          <PDFCard
            pdf={item}
            darkMode={darkMode}
          />
        );
      case 'team_members':
        return (
          <TeamMember
            member={item}
            darkMode={darkMode}
            onOpenModal={openModal}
          />
        );
      default:
        return null;
    }
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
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Search Results for "{searchTerm}"
        </h1>
        {results.length === 0 ? (
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No results found. Please try a different search term.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}
              >
                {renderResultItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoModal
            photo={selectedPhoto}
            darkMode={darkMode}
            onClose={handleClosePhoto}
          />
        )}
        {selectedMember && (
          <TeamMemberModal
            member={selectedMember}
            darkMode={darkMode}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchResults;