import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db, storage } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { FaDownload, FaFilePdf } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Publications = () => {
  const { darkMode } = useContext(ThemeContext);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const pdfsRef = ref(storage, 'pdfs');
      const pdfsList = await listAll(pdfsRef);
      const fetchedPublications = await Promise.all(
        pdfsList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            id: item.name,
            url: url,
            name: item.name // Keep file extension for PDFs
          };
        })
      );
      setPublications(fetchedPublications);
    } catch (error) {
      console.error('Error fetching publications:', error);
    }
    setLoading(false);
  };

  const handleDownload = async (publication) => {
    try {
      window.open(publication.url, '_blank');
    } catch (error) {
      console.error("Error downloading PDF: ", error);
      alert("Failed to download PDF. Please try again.");
    }
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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Publications</h1>
        <div className="space-y-6">
          {publications.map((publication) => (
            <motion.div
              key={publication.id}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaFilePdf className={`text-4xl mr-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{publication.name}</h2>
                </div>
                <button
                  onClick={() => handleDownload(publication)}
                  className={`flex items-center px-4 py-2 rounded ${
                    darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                  } text-white transition duration-300`}
                >
                  <FaDownload  className="mr-2" /> Download PDF
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Publications;
