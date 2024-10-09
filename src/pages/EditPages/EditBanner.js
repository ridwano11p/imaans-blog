import React, { useReducer, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaImage, FaVideo, FaYoutube } from 'react-icons/fa';

const initialState = {
  banners: [],
  loading: true,
  error: null,
  editingBanner: null,
  newMediaFile: null,
  isLocalMedia: true,
  tempYoutubeUrl: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BANNERS':
      return { ...state, banners: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EDITING_BANNER':
      return {
        ...state,
        editingBanner: action.payload,
        newMediaFile: null,
        isLocalMedia: action.payload ? action.payload.mediaType !== 'youtube' : true,
        tempYoutubeUrl: action.payload && action.payload.mediaType === 'youtube' ? action.payload.mediaUrl : '',
      };
    case 'UPDATE_EDITING_BANNER':
      return { ...state, editingBanner: { ...state.editingBanner, ...action.payload } };
    case 'SET_NEW_MEDIA_FILE':
      return { ...state, newMediaFile: action.payload };
    case 'SET_IS_LOCAL_MEDIA':
      return { ...state, isLocalMedia: action.payload };
    case 'SET_TEMP_YOUTUBE_URL':
      return { ...state, tempYoutubeUrl: action.payload };
    case 'REMOVE_BANNER':
      return {
        ...state,
        banners: state.banners.filter(banner => banner.id !== action.payload),
      };
    default:
      return state;
  }
}

const EditBanner = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const q = query(collection(db, 'banners'));
      const querySnapshot = await getDocs(q);
      const fetchedBanners = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch({ type: 'SET_BANNERS', payload: fetchedBanners });
    } catch (err) {
      console.error("Error fetching banners: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to fetch banners. Please try again." });
    }
  };

  const handleEdit = (banner) => {
    dispatch({ type: 'SET_EDITING_BANNER', payload: banner });
  };

  const handleMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch({ type: 'SET_NEW_MEDIA_FILE', payload: file });
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    if (state.editingBanner.title.trim().length < 3) {
      dispatch({ type: 'SET_ERROR', payload: "Title must be at least 3 characters long." });
      return;
    }

    if (state.editingBanner.description.trim().length < 10) {
      dispatch({ type: 'SET_ERROR', payload: "Description must be at least 10 characters long." });
      return;
    }

    if (!state.isLocalMedia && !validateYouTubeUrl(state.tempYoutubeUrl)) {
      dispatch({ type: 'SET_ERROR', payload: "Please provide a valid YouTube URL." });
      return;
    }

    try {
      const bannerRef = doc(db, 'banners', state.editingBanner.id);
      let updateData = {
        title: state.editingBanner.title.trim(),
        description: state.editingBanner.description.trim(),
        updatedAt: new Date()
      };

      if (state.isLocalMedia) {
        if (state.newMediaFile) {
          // Delete old media if it exists
          if (state.editingBanner.mediaUrl && state.editingBanner.mediaType !== 'youtube') {
            const oldMediaRef = ref(storage, state.editingBanner.mediaUrl);
            await deleteObject(oldMediaRef);
          }

          const mediaRef = ref(storage, `bannerstorage/${state.newMediaFile.name}`);
          await uploadBytes(mediaRef, state.newMediaFile);
          const mediaUrl = await getDownloadURL(mediaRef);
          updateData.mediaUrl = mediaUrl;
          updateData.mediaType = state.newMediaFile.type.startsWith('image/') ? 'image' : 'video';
        }

        // Remove YouTube-related fields if switching to local media
        updateData.isYouTube = false;
        updateData.youtubeId = null;
      } else {
        // If changing from local to YouTube, delete local media
        if (state.editingBanner.mediaUrl && state.editingBanner.mediaType !== 'youtube') {
          const oldMediaRef = ref(storage, state.editingBanner.mediaUrl);
          await deleteObject(oldMediaRef);
        }

        updateData.mediaUrl = state.tempYoutubeUrl;
        updateData.mediaType = 'youtube';
        updateData.isYouTube = true;
        updateData.youtubeId = extractYoutubeId(state.tempYoutubeUrl);
      }

      await updateDoc(bannerRef, updateData);
      dispatch({ type: 'SET_EDITING_BANNER', payload: null });
      fetchBanners();
    } catch (err) {
      console.error("Error updating banner: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to update banner. Please try again." });
    }
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const bannerToDelete = state.banners.find(b => b.id === bannerId);
        
        // Delete media file if it's a local media
        if (bannerToDelete.mediaUrl && bannerToDelete.mediaType !== 'youtube') {
          const mediaRef = ref(storage, bannerToDelete.mediaUrl);
          await deleteObject(mediaRef);
        }
        
        // Delete the document from Firestore
        await deleteDoc(doc(db, 'banners', bannerId));
        
        dispatch({ type: 'REMOVE_BANNER', payload: bannerId });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        console.error("Error deleting banner: ", err);
        dispatch({ type: 'SET_ERROR', payload: "Failed to delete banner. Please try again." });
      }
    }
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
          Edit Banners
        </h1>
        {state.editingBanner ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={state.editingBanner.title}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_BANNER', payload: { title: e.target.value } })}
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
                value={state.editingBanner.description}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_BANNER', payload: { description: e.target.value } })}
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
                  checked={state.isLocalMedia}
                  onChange={() => dispatch({ type: 'SET_IS_LOCAL_MEDIA', payload: true })}
                  className="mr-2"
                />
                Local Media
              </label>
              <label className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={!state.isLocalMedia}
                  onChange={() => dispatch({ type: 'SET_IS_LOCAL_MEDIA', payload: false })}
                  className="mr-2"
                />
                YouTube Video
              </label>
            </div>
            {state.isLocalMedia ? (
              <>
                <div>
                  <label htmlFor="mediaFile" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Media File</label>
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
                {state.editingBanner.mediaUrl && (
                  <div className="mt-4">
                    <label className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Current Media</label>
                    {state.editingBanner.mediaType === 'image' ? (
                      <img src={state.editingBanner.mediaUrl} alt="Current Banner" className="max-w-full h-auto rounded-md" />
                    ) : (
                      <video src={state.editingBanner.mediaUrl} controls className="max-w-full h-auto rounded-md"></video>
                    )}
                  </div>
                )}
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
                onClick={() => dispatch({ type: 'SET_EDITING_BANNER', payload: null })}
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
                Update Banner
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.banners.map((banner) => (
              <div key={banner.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="relative mb-4">
                  {banner.mediaType === 'image' ? (
                    <img src={banner.mediaUrl} alt={banner.title} className="w-full h-48 object-cover rounded-md" />
                  ) : banner.mediaType === 'video' ? (
                    <video src={banner.mediaUrl} className="w-full h-48 object-cover rounded-md" controls></video>
                  ) : (
                    <iframe
                      src={`https://www.youtube.com/embed/${banner.youtubeId}`}
                      title={banner.title}
                      className="w-full h-48 rounded-md"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2">
                    {banner.mediaType === 'image' ? (
                      <FaImage className="text-white" />
                    ) : banner.mediaType === 'video' ? (
                      <FaVideo className="text-white" />
                    ) : (
                      <FaYoutube className="text-white" />
                    )}
                  </div>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{banner.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{banner.description}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleEdit(banner)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
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

export default EditBanner;