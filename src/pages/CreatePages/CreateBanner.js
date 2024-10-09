import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaSpinner } from 'react-icons/fa';

const CreateBanner = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLocalMedia, setIsLocalMedia] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
    }
  };

  const validateYouTubeUrl = (url) => {
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})$/;
    const match = url.match(regExp);
    return match && match[1].length === 11;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      setLoading(false);
      return;
    }

    if (isLocalMedia && !mediaFile) {
      setError("Please upload a media file.");
      setLoading(false);
      return;
    }

    if (!isLocalMedia) {
      if (!youtubeUrl) {
        setError("Please provide a YouTube URL.");
        setLoading(false);
        return;
      }

      if (!validateYouTubeUrl(youtubeUrl)) {
        setError("Please provide a valid YouTube URL.");
        setLoading(false);
        return;
      }
    }

    try {
      let mediaUrl = youtubeUrl;
      let mediaType = isLocalMedia ? (mediaFile.type.startsWith('image/') ? 'image' : 'video') : 'youtube';

      if (isLocalMedia) {
        const mediaRef = ref(storage, `bannerstorage/${mediaFile.name}`);
        await uploadBytes(mediaRef, mediaFile);
        mediaUrl = await getDownloadURL(mediaRef);
      }

      const bannerData = {
        title: title.trim(),
        description: description.trim(),
        mediaUrl,
        mediaType,
        isYouTube: !isLocalMedia,
        youtubeId: !isLocalMedia ? youtubeUrl.match(/[a-zA-Z0-9_-]{11}/)[0] : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'banners'), bannerData);
      navigate('/');
    } catch (err) {
      console.error("Error creating banner: ", err);
      setError("Failed to create banner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Create New Banner
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            />
          </div>
          <div>
            <label htmlFor="description" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows="5"
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            ></textarea>
          </div>
          <div className="flex items-center space-x-4">
            <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={isLocalMedia}
                onChange={() => setIsLocalMedia(true)}
                className="mr-2"
              />
              Upload Local Media
            </label>
            <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={!isLocalMedia}
                onChange={() => setIsLocalMedia(false)}
                className="mr-2"
              />
              Add YouTube Video
            </label>
          </div>
          {isLocalMedia ? (
            <div>
              <label htmlFor="mediaFile" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Upload Media File</label>
              <input
                type="file"
                id="mediaFile"
                onChange={handleMediaFileChange}
                accept="image/*,video/*"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="youtubeUrl" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>YouTube Video URL</label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
          )}
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
              'Create Banner'
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

export default CreateBanner;