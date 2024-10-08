import React, { useReducer, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaPlay, FaYoutube, FaFile } from 'react-icons/fa';

const initialState = {
  videos: [],
  loading: true,
  error: null,
  editingVideo: null,
  newVideoFile: null,
  newThumbnail: null,
  isLocalVideo: true,
  tempYoutubeUrl: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIDEOS':
      return { ...state, videos: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EDITING_VIDEO':
      return {
        ...state,
        editingVideo: action.payload,
        newVideoFile: null,
        newThumbnail: null,
        isLocalVideo: action.payload ? !action.payload.isYouTube : true,
        tempYoutubeUrl: action.payload ? action.payload.youtubeUrl || '' : '',
      };
    case 'UPDATE_EDITING_VIDEO':
      return { ...state, editingVideo: { ...state.editingVideo, ...action.payload } };
    case 'SET_NEW_VIDEO_FILE':
      return { ...state, newVideoFile: action.payload };
    case 'SET_NEW_THUMBNAIL':
      return { ...state, newThumbnail: action.payload };
    case 'SET_IS_LOCAL_VIDEO':
      return { ...state, isLocalVideo: action.payload };
    case 'SET_TEMP_YOUTUBE_URL':
      return { ...state, tempYoutubeUrl: action.payload };
    case 'REMOVE_VIDEO':
      return {
        ...state,
        newVideoFile: null,
        newThumbnail: null,
        tempYoutubeUrl: '',
      };
    default:
      return state;
  }
}

const EditVideo = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const q = query(collection(db, 'videos'));
      const querySnapshot = await getDocs(q);
      const fetchedVideos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_VIDEOS', payload: fetchedVideos });
    } catch (err) {
      console.error("Error fetching videos: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to fetch videos. Please try again." });
    }
  };

  const handleEdit = (video) => {
    dispatch({ type: 'SET_EDITING_VIDEO', payload: video });
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch({ type: 'SET_NEW_VIDEO_FILE', payload: file });
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch({ type: 'SET_NEW_THUMBNAIL', payload: file });
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
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    if (state.editingVideo.title.trim().length < 3) {
      dispatch({ type: 'SET_ERROR', payload: "Title must be at least 3 characters long." });
      return;
    }

    if (state.editingVideo.description.trim().length < 10) {
      dispatch({ type: 'SET_ERROR', payload: "Description must be at least 10 characters long." });
      return;
    }

    if (!state.isLocalVideo && !validateYouTubeUrl(state.tempYoutubeUrl)) {
      dispatch({ type: 'SET_ERROR', payload: "Please provide a valid YouTube URL." });
      return;
    }

    try {
      const videoRef = doc(db, 'videos', state.editingVideo.id);
      let updateData = {
        title: state.editingVideo.title.trim(),
        description: state.editingVideo.description.trim(),
        isYouTube: !state.isLocalVideo,
        updatedAt: new Date()
      };

      if (state.isLocalVideo) {
        if (state.newVideoFile) {
          // Delete old video if it exists
          if (state.editingVideo.videoUrl && !state.editingVideo.isYouTube) {
            const oldVideoRef = ref(storage, state.editingVideo.videoUrl);
            await deleteObject(oldVideoRef);
          }

          const videoFileRef = ref(storage, `videos/${state.newVideoFile.name}`);
          await uploadBytes(videoFileRef, state.newVideoFile);
          const videoUrl = await getDownloadURL(videoFileRef);
          updateData.videoUrl = videoUrl;

          // Generate thumbnail if not provided
          if (!state.newThumbnail) {
            const generatedThumbnail = await generateThumbnail(state.newVideoFile);
            const thumbnailRef = ref(storage, `video_thumbnails/generated_${state.newVideoFile.name}.jpg`);
            await uploadBytes(thumbnailRef, generatedThumbnail);
            const thumbnailUrl = await getDownloadURL(thumbnailRef);
            updateData.thumbnailUrl = thumbnailUrl;
          }
        }

        if (state.newThumbnail) {
          // Delete old thumbnail if it exists
          if (state.editingVideo.thumbnailUrl) {
            const oldThumbnailRef = ref(storage, state.editingVideo.thumbnailUrl);
            await deleteObject(oldThumbnailRef);
          }

          const thumbnailRef = ref(storage, `video_thumbnails/${state.newThumbnail.name}`);
          await uploadBytes(thumbnailRef, state.newThumbnail);
          const thumbnailUrl = await getDownloadURL(thumbnailRef);
          updateData.thumbnailUrl = thumbnailUrl;
        }

        // Remove YouTube-related fields if switching to local video
        updateData.youtubeUrl = null;
        updateData.youtubeId = null;
      } else {
        // If changing from local to YouTube, delete local video and thumbnail
        if (state.editingVideo.videoUrl) {
          const oldVideoRef = ref(storage, state.editingVideo.videoUrl);
          await deleteObject(oldVideoRef);
        }
        if (state.editingVideo.thumbnailUrl) {
          const oldThumbnailRef = ref(storage, state.editingVideo.thumbnailUrl);
          await deleteObject(oldThumbnailRef);
        }

        updateData.youtubeUrl = state.tempYoutubeUrl;
        updateData.youtubeId = extractYoutubeId(state.tempYoutubeUrl);
        updateData.videoUrl = null;
        updateData.thumbnailUrl = null;
      }

      await updateDoc(videoRef, updateData);
      dispatch({ type: 'SET_EDITING_VIDEO', payload: null });
      fetchVideos();
    } catch (err) {
      console.error("Error updating video: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to update video. Please try again." });
    }
  };

  const handleDelete = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const videoToDelete = state.videos.find(v => v.id === videoId);
        
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
        dispatch({ type: 'SET_ERROR', payload: "Failed to delete video. Please try again." });
      }
    }
  };

  const handleRemoveVideo = () => {
    dispatch({ type: 'REMOVE_VIDEO' });
  };

  if (state.loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (state.error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{state.error}</div>;
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit Videos
        </h1>
        {state.editingVideo ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={state.editingVideo.title}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_VIDEO', payload: { title: e.target.value } })}
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
                value={state.editingVideo.description}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_VIDEO', payload: { description: e.target.value } })}
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
                  checked={state.isLocalVideo}
                  onChange={() => dispatch({ type: 'SET_IS_LOCAL_VIDEO', payload: true })}
                  className="mr-2"
                />
                Local Video
              </label>
              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={!state.isLocalVideo}
                  onChange={() => dispatch({ type: 'SET_IS_LOCAL_VIDEO', payload: false })}
                  className="mr-2"
                />
                YouTube Video
              </label>
            </div>
            {state.isLocalVideo ? (
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
                  value={state.tempYoutubeUrl}
                  onChange={(e) => dispatch({ type: 'SET_TEMP_YOUTUBE_URL', payload: e.target.value })}
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
                onClick={() => dispatch({ type: 'SET_EDITING_VIDEO', payload: null })}
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
              {((state.isLocalVideo && state.newVideoFile) || (!state.isLocalVideo && state.tempYoutubeUrl)) && (
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
            {state.videos.map((video) => (
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