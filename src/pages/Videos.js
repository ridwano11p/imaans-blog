import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db, storage } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { FaChevronLeft, FaChevronRight, FaTimes, FaPlay, FaYoutube } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Videos = () => {
  const { darkMode } = useContext(ThemeContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // Fetch uploaded videos from storage
      const videosRef = ref(storage, 'videos');
      const videosList = await listAll(videosRef);
      const uploadedVideos = await Promise.all(
        videosList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            id: item.name,
            url: url,
            name: item.name.split('.').slice(0, -1).join('.'), // Remove file extension
            type: 'uploaded'
          };
        })
      );

      // Fetch linked YouTube videos from Firestore
      const blogsRef = collection(db, 'blogs');
      const blogsSnapshot = await getDocs(blogsRef);
      const linkedVideos = blogsSnapshot.docs
        .filter(doc => doc.data().isLinkedVideo && doc.data().videoUrl)
        .map(doc => ({
          id: doc.id,
          url: doc.data().videoUrl,
          type: 'youtube'
        }));

      // Combine and set all videos
      setVideos([...uploadedVideos, ...linkedVideos]);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
    setLoading(false);
  };

  const openGallery = (video) => {
    setCurrentVideo(video);
  };

  const closeGallery = () => {
    setCurrentVideo(null);
  };

  const nextVideo = () => {
    const currentIndex = videos.findIndex((video) => video.id === currentVideo.id);
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentVideo(videos[nextIndex]);
  };

  const prevVideo = () => {
    const currentIndex = videos.findIndex((video) => video.id === currentVideo.id);
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentVideo(videos[prevIndex]);
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Video Gallery</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              onClick={() => openGallery(video)}
            >
              <div className="relative aspect-video">
                {video.type === 'uploaded' ? (
                  <video src={video.url} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeVideoId(video.url)}/0.jpg`}
                    alt="YouTube thumbnail"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  {video.type === 'uploaded' ? (
                    <FaPlay className="text-white text-4xl" />
                  ) : (
                    <FaYoutube className="text-white text-4xl" />
                  )}
                </div>
              </div>
              {video.type === 'uploaded' && (
                <div className="p-4">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{video.name}</h2>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
            onClick={closeGallery}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {currentVideo.type === 'uploaded' ? (
                <video src={currentVideo.url} controls className="max-w-full max-h-[80vh]" />
              ) : (
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentVideo.url)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="max-w-full max-h-[80vh]"
                ></iframe>
              )}
              <button
                className="absolute top-2 right-2 text-white text-2xl"
                onClick={closeGallery}
              >
                <FaTimes />
              </button>
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-4xl"
                onClick={prevVideo}
              >
                <FaChevronLeft />
              </button>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-4xl"
                onClick={nextVideo}
              >
                <FaChevronRight />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Videos;
