import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaSpinner } from 'react-icons/fa';

const CreateVideo = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLocalVideo, setIsLocalVideo] = useState(true);

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
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

    // Form validation
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

    if (isLocalVideo && !videoFile) {
      setError("Please upload a video file.");
      setLoading(false);
      return;
    }

    if (!isLocalVideo) {
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
      let videoUrl = youtubeUrl;
      let thumbnailUrl = null;

      if (isLocalVideo) {
        const videoRef = ref(storage, `videos/${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);

        if (thumbnail) {
          const thumbnailRef = ref(storage, `video_thumbnails/${thumbnail.name}`);
          await uploadBytes(thumbnailRef, thumbnail);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
        }
      }

      const videoData = {
        title: title.trim(),
        description: description.trim(),
        videoUrl,
        thumbnailUrl,
        isYouTube: !isLocalVideo,
        youtubeId: !isLocalVideo ? youtubeUrl.match(/[a-zA-Z0-9_-]{11}/)[0] : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'videos'), videoData);
      navigate('/documentaries/videos');
    } catch (err) {
      console.error("Error creating video: ", err);
      setError("Failed to create video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Add New Video
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
                checked={isLocalVideo}
                onChange={() => setIsLocalVideo(true)}
                className="mr-2"
              />
              Upload Local Video
            </label>
            <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={!isLocalVideo}
                onChange={() => setIsLocalVideo(false)}
                className="mr-2"
              />
              Add YouTube Video
            </label>
          </div>
          {isLocalVideo ? (
            <>
              <div>
                <label htmlFor="videoFile" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Upload Video File</label>
                <input
                  type="file"
                  id="videoFile"
                  onChange={handleVideoFileChange}
                  accept="video/*"
                  className={`w-full px-3 py-2 border rounded-md ${
                    darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="thumbnail" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Thumbnail Image</label>
                <input
                  type="file"
                  id="thumbnail"
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className={`w-full px-3 py-2 border rounded-md ${
                    darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </>
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
              'Add Video'
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

export default CreateVideo;