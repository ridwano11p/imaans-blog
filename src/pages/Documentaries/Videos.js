import React, { useContext, useEffect, useState, useRef } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaSpinner, FaPlay, FaTimes } from 'react-icons/fa';

const VideoCard = ({ video, darkMode, onPlay }) => {
  const thumbnailUrl = video.isYouTube 
    ? `https://img.youtube.com/vi/${video.youtubeId}/0.jpg` 
    : (video.thumbnailUrl || video.videoUrl);

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="relative">
        <img src={thumbnailUrl} alt={video.title} className="w-full h-48 object-cover" />
        <button
          onClick={() => onPlay(video)}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-75 transition duration-300"
        >
          <FaPlay className="text-white text-4xl" />
        </button>
      </div>
      <div className="p-4">
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{video.title}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{video.description}</p>
      </div>
    </div>
  );
};

const VideoModal = ({ video, onClose, darkMode }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <FaTimes size={24} />
        </button>
        {video.isYouTube ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video rounded-lg"
          ></iframe>
        ) : (
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            className="w-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
};

const Videos = () => {
  const { darkMode } = useContext(ThemeContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const videoList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideos(videoList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching videos: ", err);
        setError("Failed to fetch videos. Please try again later.");
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handlePlayVideo = (video) => {
    setActiveVideo(video);
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Documentaries
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              darkMode={darkMode}
              onPlay={handlePlayVideo}
            />
          ))}
        </div>
      </div>
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={handleCloseVideo}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default Videos;