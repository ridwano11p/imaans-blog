import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaSpinner, FaExpand, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Img } from 'react-image';

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

const Modal = ({ photo, darkMode, onClose }) => {
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

const Photos = () => {
  const { darkMode } = useContext(ThemeContext);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'photos'));
        const photoList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPhotos(photoList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching photos: ", err);
        setError("Failed to fetch photos. Please try again later.");
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Photo Gallery
        </h1>
        
        {photos.length === 0 ? (
          <div className={`text-center mt-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No photos created
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                darkMode={darkMode}
                onClick={handlePhotoClick}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedPhoto && (
            <Modal
              photo={selectedPhoto}
              darkMode={darkMode}
              onClose={handleCloseModal}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Photos;