import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ThemeContext } from '../../context/ThemeContext';

const CreateBanner = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [videoType, setVideoType] = useState('upload');
  const [media, setMedia] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaUrl = '';
      let isYouTubeVideo = false;

      if (mediaType === 'image' || (mediaType === 'video' && videoType === 'upload')) {
        if (media) {
          const storageRef = ref(storage, `banners/${media.name}`);
          await uploadBytes(storageRef, media);
          mediaUrl = await getDownloadURL(storageRef);
        }
      } else if (mediaType === 'video' && videoType === 'youtube') {
        mediaUrl = youtubeUrl;
        isYouTubeVideo = true;
      }

      await addDoc(collection(db, 'banners'), {
        title,
        description,
        mediaType,
        mediaUrl,
        isYouTubeVideo,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      navigate('/');
    } catch (error) {
      console.error('Error creating banner: ', error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-6">Create New Banner</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              rows="4"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Media Type</label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="image"
                  checked={mediaType === 'image'}
                  onChange={() => setMediaType('image')}
                  className="form-radio"
                />
                <span className="ml-2">Image</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="video"
                  checked={mediaType === 'video'}
                  onChange={() => setMediaType('video')}
                  className="form-radio"
                />
                <span className="ml-2">Video</span>
              </label>
            </div>
          </div>
          {mediaType === 'video' && (
            <div className="mb-4">
              <label className="block mb-2">Video Type</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="upload"
                    checked={videoType === 'upload'}
                    onChange={() => setVideoType('upload')}
                    className="form-radio"
                  />
                  <span className="ml-2">Upload Video</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="youtube"
                    checked={videoType === 'youtube'}
                    onChange={() => setVideoType('youtube')}
                    className="form-radio"
                  />
                  <span className="ml-2">YouTube URL</span>
                </label>
              </div>
            </div>
          )}
          {mediaType === 'image' || (mediaType === 'video' && videoType === 'upload') ? (
            <div className="mb-4">
              <label htmlFor="media" className="block mb-2">{mediaType === 'image' ? 'Image' : 'Video'}</label>
              <input
                type="file"
                id="media"
                onChange={(e) => setMedia(e.target.files[0])}
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="youtubeUrl" className="block mb-2">YouTube URL</label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Banner'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBanner;