import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaSpinner } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const CreateBlog = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
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
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`Video size should be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return;
    }
    setVideo(file);
  };

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Form validation
    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters long.");
      setLoading(false);
      return;
    }

    if (content.trim().length < 50) {
      setError("Content must be at least 50 characters long.");
      setLoading(false);
      return;
    }

    if (isYouTubeVideo && !validateYouTubeUrl(youTubeUrl)) {
      setError("Please enter a valid YouTube URL.");
      setLoading(false);
      return;
    }

    try {
      let imageUrl = null;
      let videoUrl = null;
      let youtubeId = null;

      if (image) {
        const imageRef = ref(storage, `blog_images/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (isYouTubeVideo) {
        youtubeId = extractYoutubeId(youTubeUrl);
        videoUrl = youTubeUrl;
      } else if (video) {
        const videoRef = ref(storage, `blog_videos/${Date.now()}_${video.name}`);
        await uploadBytes(videoRef, video);
        videoUrl = await getDownloadURL(videoRef);
      }

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        imageUrl,
        videoUrl,
        youtubeId,
        isYouTubeVideo,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'blogs'), blogData);
      navigate('/impact-stories');
    } catch (err) {
      console.error("Error creating blog post: ", err);
      setError("Failed to create blog post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Create New Blog Post
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
              minLength={5}
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            />
          </div>
          <div>
            <label htmlFor="content" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength={50}
              rows="10"
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
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className={`flex items-center mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={isYouTubeVideo}
                onChange={() => setIsYouTubeVideo(!isYouTubeVideo)}
                className="mr-2"
              />
              YouTube Video
            </label>
            {isYouTubeVideo ? (
              <input
                type="url"
                value={youTubeUrl}
                onChange={(e) => setYouTubeUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            ) : (
              <input
                type="file"
                onChange={handleVideoChange}
                accept="video/*"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            )}
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
              'Create Blog Post'
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

export default CreateBlog;