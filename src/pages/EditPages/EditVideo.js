import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaPlay, FaYoutube, FaFile } from 'react-icons/fa';

const EditVideo = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [isLocalVideo, setIsLocalVideo] = useState(true);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'videos'));
      const querySnapshot = await getDocs(q);
      const fetchedVideos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(fetchedVideos);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching videos: ", err);
      setError("Failed to fetch videos. Please try again.");
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setNewVideoFile(null);
    setNewThumbnail(null);
    setIsLocalVideo(!video.isYouTube);
    setTempYoutubeUrl(video.youtubeUrl || '');
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVideoFile(file);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewThumbnail(file);
    }
  };

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const generateThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.load();
      video.onloadeddata = () => {
        video.currentTime = 1; // Capture frame at 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
      };
      video.onerror = reject;
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingVideo.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (editingVideo.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      setLoading(false);
      return;
    }

    if (!isLocalVideo && !validateYouTubeUrl(tempYoutubeUrl)) {
      setError("Please provide a valid YouTube URL.");
      setLoading(false);
      return;
    }

    try {
      const videoRef = doc(db, 'videos', editingVideo.id);
      let updateData = {
        title: editingVideo.title.trim(),
        description: editingVideo.description.trim(),
        isYouTube: !isLocalVideo,
        updatedAt: new Date()
      };

      if (isLocalVideo) {
        if (newVideoFile) {
          // Delete old video if it exists
          if (editingVideo.videoUrl && !editingVideo.isYouTube) {
            const oldVideoRef = ref(storage, editingVideo.videoUrl);
            await deleteObject(oldVideoRef);
          }

          const videoFileRef = ref(storage, `videos/${newVideoFile.name}`);
          await uploadBytes(videoFileRef, newVideoFile);
          const videoUrl = await getDownloadURL(videoFileRef);
          updateData.videoUrl = videoUrl;

          // Generate thumbnail if not provided
          if (!newThumbnail) {
            const generatedThumbnail = await generateThumbnail(newVideoFile);
            const thumbnailRef = ref(storage, `video_thumbnails/generated_${newVideoFile.name}.jpg`);
            await uploadBytes(thumbnailRef, generatedThumbnail);
            const thumbnailUrl = await getDownloadURL(thumbnailRef);
            updateData.thumbnailUrl = thumbnailUrl;
          }
        }

        if (newThumbnail) {
          // Delete old thumbnail if it exists
          if (editingVideo.thumbnailUrl) {
            const oldThumbnailRef = ref(storage, editingVideo.thumbnailUrl);
            await deleteObject(oldThumbnailRef);
          }

          const thumbnailRef = ref(storage, `video_thumbnails/${newThumbnail.name}`);
          await uploadBytes(thumbnailRef, newThumbnail);
          const thumbnailUrl = await getDownloadURL(thumbnailRef);
          updateData.thumbnailUrl = thumbnailUrl;
        }

        // Remove YouTube-related fields if switching to local video
        updateData.youtubeUrl = null;
        updateData.youtubeId = null;
      } else {
        // If changing from local to YouTube, delete local video and thumbnail
        if (editingVideo.videoUrl) {
          const oldVideoRef = ref(storage, editingVideo.videoUrl);
          await deleteObject(oldVideoRef);
        }
        if (editingVideo.thumbnailUrl) {
          const oldThumbnailRef = ref(storage, editingVideo.thumbnailUrl);
          await deleteObject(oldThumbnailRef);
        }

        updateData.youtubeUrl = tempYoutubeUrl;
        updateData.youtubeId = extractYoutubeId(tempYoutubeUrl);
        updateData.videoUrl = null;
        updateData.thumbnailUrl = null;
      }

      await updateDoc(videoRef, updateData);
      setEditingVideo(null);
      fetchVideos();
    } catch (err) {
      console.error("Error updating video: ", err);
      setError("Failed to update video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      setLoading(true);
      try {
        const videoToDelete = videos.find(v => v.id === videoId);
        
        // Delete video file if it's a local video
        if (videoToDelete.videoUrl && !videoToDelete.isYouTube) {
          const videoRef = ref(storage, videoToDelete.videoUrl);
          await deleteObject(videoRef);
        }
        
        // Delete thumbnail if it exists
        if (videoToDelete.thumbnailUrl) {
          const thumbnailRef = ref(storage, videoToDelete.thumbnailUrl);
          await deleteObject(thumbnailRef);
        }
        
        // Delete the document from Firestore
        await deleteDoc(doc(db, 'videos', videoId));
        
        // Check if this was the last item in the collection
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        if (videosSnapshot.empty) {
          // If the collection is now empty, delete the entire 'videos' folder in Storage
          const videosRef = ref(storage, 'videos');
          const videosList = await listAll(videosRef);
          await Promise.all(videosList.items.map(item => deleteObject(item)));
          
          const thumbnailsRef = ref(storage, 'video_thumbnails');
          const thumbnailsList = await listAll(thumbnailsRef);
          await Promise.all(thumbnailsList.items.map(item => deleteObject(item)));
        }
        
        fetchVideos();
      } catch (err) {
        console.error("Error deleting video: ", err);
        setError("Failed to delete video. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveVideo = () => {
    if (isLocalVideo) {
      setNewVideoFile(null);
      setNewThumbnail(null);
    } else {
      setTempYoutubeUrl('');
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit Videos
        </h1>
        {editingVideo ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={editingVideo.title}
                onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
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
                value={editingVideo.description}
                onChange={(e) => setEditingVideo({...editingVideo, description: e.target.value})}
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
                Local Video
              </label>
              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={!isLocalVideo}
                  onChange={() => setIsLocalVideo(false)}
                  className="mr-2"
                />
                YouTube Video
              </label>
            </div>
            {isLocalVideo ? (
              <>
                <div>
                  <label htmlFor="video" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Video File</label>
                  <input
                    type="file"
                    id="video"
                    onChange={handleVideoFileChange}
                    accept="video/*"
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="thumbnail" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Thumbnail</label>
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
                <label htmlFor="youtubeUrl" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>YouTube URL</label>
                <input
                  type="url"
                  id="youtubeUrl"
                  value={tempYoutubeUrl}
                  onChange={(e) => setTempYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-3 py-2 border rounded-md ${
                    darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                } text-gray-800 transition duration-300`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300`}
              >
                Update Video
              </button>
              {((isLocalVideo && newVideoFile) || (!isLocalVideo && tempYoutubeUrl)) && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                  } text-white transition duration-300 flex items-center`}
                >
                  <FaTrash className="mr-2" /> Remove New Video
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="relative">
                  <img 
                    src={video.isYouTube ? `https://img.youtube.com/vi/${video.youtubeId}/0.jpg` : (video.thumbnailUrl || video.videoUrl)} 
                    alt={video.title} 
                    className="w-full h-48 object-cover rounded-md mb-4" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {video.isYouTube ? <FaYoutube className="text-white text-4xl" /> : <FaPlay className="text-white text-4xl" />}
                  </div>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{video.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{video.description}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleEdit(video)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaTrash className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditVideo;