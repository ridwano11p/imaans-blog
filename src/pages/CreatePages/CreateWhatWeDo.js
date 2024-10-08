import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaSpinner } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const CreateWhatWeDo = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [mission, setMission] = useState('');
  const [approach, setApproach] = useState('');
  const [impact, setImpact] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image size should be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
        return;
      }
      
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
          maxWidthOrHeight: 1920
        });
        setImage(compressedFile);
      } catch (err) {
        console.error("Error compressing image: ", err);
        setError("Failed to process image. Please try again.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Form validation
    if (mission.trim().length < 20) {
      setError("Mission statement must be at least 20 characters long.");
      setLoading(false);
      return;
    }

    if (approach.trim().length < 20) {
      setError("Approach description must be at least 20 characters long.");
      setLoading(false);
      return;
    }

    if (impact.trim().length < 20) {
      setError("Impact description must be at least 20 characters long.");
      setLoading(false);
      return;
    }

    if (!image) {
      setError("Please upload an image.");
      setLoading(false);
      return;
    }

    try {
      let imageUrl = null;

      if (image) {
        const imageRef = ref(storage, `what_we_do/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const whatWeDoData = {
        mission: mission.trim(),
        approach: approach.trim(),
        impact: impact.trim(),
        imageUrl,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'about', 'what_we_do'), whatWeDoData);
      navigate('/about/what-we-do');
    } catch (err) {
      console.error("Error creating 'What We Do' info: ", err);
      setError("Failed to create 'What We Do' information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Create 'What We Do' Information
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="mission" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Our Mission</label>
            <textarea
              id="mission"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              required
              minLength={20}
              rows="5"
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            ></textarea>
          </div>
          <div>
            <label htmlFor="approach" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Our Approach</label>
            <textarea
              id="approach"
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              required
              minLength={20}
              rows="5"
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            ></textarea>
          </div>
          <div>
            <label htmlFor="impact" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Our Impact</label>
            <textarea
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              required
              minLength={20}
              rows="5"
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            ></textarea>
          </div>
          <div>
            <label htmlFor="image" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Image</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              accept="image/*"
              required
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 rounded-md ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <FaSpinner className="animate-spin mx-auto" />
            ) : (
              "Create 'What We Do' Information"
            )}
          </button>
        </form>
        {error && (
          <div className={`mt-4 p-4 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWhatWeDo;