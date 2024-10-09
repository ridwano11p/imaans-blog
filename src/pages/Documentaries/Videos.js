import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaSpinner, FaPlay, FaTimes } from 'react-icons/fa';
import VideoPlayer from '../../components/VideoPlayer';

const VideoCard = ({ video, darkMode, onPlay }) => {
  const thumbnailUrl = video.isYouTube 
    ? `https://img.youtube.com/vi/${video.youtubeId}/0.jpg` 
    : (video.thumbnailUrl || video.videoUrl);

  return (
    <div className={`rounded-lg shadow-md overflow-hidden transition-transform duration-300 transform hover:scale-105 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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

const VideoModal = ({ video, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 md:p-8">
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition duration-300 z-10"
        >
          <FaTimes size={24} />
        </button>
        <div className="aspect-square w-full">
          <VideoPlayer
            videoUrl={video.isYouTube ? `https://www.youtube.com/watch?v=${video.youtubeId}` : video.videoUrl}
            isYouTubeVideo={video.isYouTube}
          />
        </div>
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        />
      )}
    </div>
  );
};

export default Videos;
