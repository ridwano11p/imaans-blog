import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';

const WhatWeDo = () => {
  const { darkMode } = useContext(ThemeContext);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'about', 'what_we_do');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setContent(docSnap.data());
        } else {
          setError("No content found. Please add content for 'What We Do'.");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching 'What We Do' content: ", err);
        setError("Failed to fetch content. Please try again later.");
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

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
          What We Do
        </h1>
        {content && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none md:w-2/3`}>
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Our Mission
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {content.mission}
              </p>
              
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Our Approach
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {content.approach}
              </p>
              
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Our Impact
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {content.impact}
              </p>
            </div>
            <div className="md:w-1/3">
              {content.imageUrl && (
                <img 
                  src={content.imageUrl} 
                  alt="Our Work" 
                  className="w-full h-auto rounded-lg shadow-md sticky top-4"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatWeDo;