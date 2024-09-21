import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ThemeContext } from '../../context/ThemeContext';

const EditBanner = () => {
  const [bannerId, setBannerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [videoType, setVideoType] = useState('upload');
  const [currentMediaUrl, setCurrentMediaUrl] = useState('');
  const [newMedia, setNewMedia] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchBannerContent = async () => {
      try {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const bannerData = querySnapshot.docs[0].data();
          setBannerId(querySnapshot.docs[0].id);
          setTitle(bannerData.title);
          setDescription(bannerData.description);
          setMediaType(bannerData.mediaType || 'image');
          setCurrentMediaUrl(bannerData.mediaUrl);
          if (bannerData.isYouTubeVideo) {
            setVideoType('youtube');
            setYoutubeUrl(bannerData.mediaUrl);
          } else {
            setVideoType('upload');
          }
        }
      } catch (err) {
        console.error("Error fetching banner content: ", err);
      }
    };

    fetchBannerContent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaUrl = currentMediaUrl;
      let isYouTubeVideo = false;

      if (mediaType === 'image' || (mediaType === 'video' && videoType === 'upload')) {
        if (newMedia) {
          // Delete old media if switching types or updating with new media
          if (currentMediaUrl && !currentMediaUrl.includes('youtube.com')) {
            const oldMediaRef = ref(storage, currentMediaUrl);
            await deleteObject(oldMediaRef);
          }

          const storageRef = ref(storage, `banners/${newMedia.name}`);
          await uploadBytes(storageRef, newMedia);
          mediaUrl = await getDownloadURL(storageRef);
        }
      } else if (mediaType === 'video' && videoType === 'youtube') {
        mediaUrl = youtubeUrl;
        isYouTubeVideo = true;

        // Delete old uploaded video if exists
        if (currentMediaUrl && !currentMediaUrl.includes('youtube.com')) {
          const oldMediaRef = ref(storage, currentMediaUrl);
          await deleteObject(oldMediaRef);
        }
      }

      await updateDoc(doc(db, 'banners', bannerId), {
        title,
        description,
        mediaType,
        mediaUrl,
        isYouTubeVideo,
      });

      setLoading(false);
      navigate('/');
    } catch (error) {
      console.error('Error updating banner: ', error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-6">Edit Banner</h1>
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
          <div className="mb-4">
            <label htmlFor="media" className="block mb-2">Current {mediaType === 'image' ? 'Image' : 'Video'}</label>
            {currentMediaUrl && (
              mediaType === 'image' ? (
                <img src={currentMediaUrl} alt="Current Banner" className="w-full mb-2 rounded" />
              ) : videoType === 'youtube' ? (
                <iframe
                  src={`https://www.youtube.com/embed/${currentMediaUrl.split('v=')[1]}`}
                  title="YouTube video player"
                  className="w-full mb-2 rounded aspect-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={currentMediaUrl} controls className="w-full mb-2 rounded" />
              )
            )}
            {mediaType === 'image' || (mediaType === 'video' && videoType === 'upload') ? (
              <input
                type="file"
                id="media"
                onChange={(e) => setNewMedia(e.target.files[0])}
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
              />
            ) : (
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              />
            )}
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Banner'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditBanner;