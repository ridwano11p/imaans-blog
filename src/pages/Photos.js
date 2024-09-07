import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db, storage } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Photos = () => {
  const { darkMode } = useContext(ThemeContext);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const imagesRef = ref(storage, 'images');
      const imagesList = await listAll(imagesRef);
      const fetchedPhotos = await Promise.all(
        imagesList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            id: item.name,
            url: url,
            name: item.name.split('.').slice(0, -1).join('.') // Remove file extension
          };
        })
      );
      setPhotos(fetchedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
    setLoading(false);
  };

  const openGallery = (photo) => {
    setCurrentPhoto(photo);
  };

  const closeGallery = () => {
    setCurrentPhoto(null);
  };

  const nextPhoto = () => {
    const currentIndex = photos.findIndex((photo) => photo.id === currentPhoto.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setCurrentPhoto(photos[nextIndex]);
  };

  const prevPhoto = () => {
    const currentIndex = photos.findIndex((photo) => photo.id === currentPhoto.id);
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    setCurrentPhoto(photos[prevIndex]);
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
        <h1 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Photo Gallery</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              onClick={() => openGallery(photo)}
            >
              <img src={photo.url} alt={photo.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{photo.name}</h2>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {currentPhoto && (
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
              <img src={currentPhoto.url} alt={currentPhoto.name} className="max-w-full max-h-[80vh] object-contain" />
              <button
                className="absolute top-2 right-2 text-white text-2xl"
                onClick={closeGallery}
              >
                <FaTimes />
              </button>
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-4xl"
                onClick={prevPhoto}
              >
                <FaChevronLeft />
              </button>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-4xl"
                onClick={nextPhoto}
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

export default Photos;
