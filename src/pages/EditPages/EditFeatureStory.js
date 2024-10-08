import React, { useReducer, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const initialState = {
  stories: [],
  loading: true,
  error: null,
  editingStory: null,
  newImage: null,
  newVideo: null,
  isYouTubeVideo: false,
  youTubeUrl: '',
  tags: [],
  newTag: '',
  removedImage: false,
  removedVideo: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STORIES':
      return { ...state, stories: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EDITING_STORY':
      return {
        ...state,
        editingStory: action.payload,
        newImage: null,
        newVideo: null,
        isYouTubeVideo: action.payload ? action.payload.isYouTubeVideo || false : false,
        youTubeUrl: action.payload ? action.payload.videoUrl || '' : '',
        tags: action.payload ? action.payload.tags || [] : [],
        removedImage: false,
        removedVideo: false,
      };
    case 'UPDATE_EDITING_STORY':
      return { ...state, editingStory: { ...state.editingStory, ...action.payload } };
    case 'SET_NEW_IMAGE':
      return { ...state, newImage: action.payload, removedImage: false };
    case 'SET_NEW_VIDEO':
      return {
        ...state,
        newVideo: action.payload,
        removedVideo: false,
        isYouTubeVideo: false,
        youTubeUrl: '',
      };
    case 'SET_IS_YOUTUBE_VIDEO':
      return { ...state, isYouTubeVideo: action.payload };
    case 'SET_YOUTUBE_URL':
      return { ...state, youTubeUrl: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'SET_NEW_TAG':
      return { ...state, newTag: action.payload };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.payload], newTag: '' };
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(tag => tag !== action.payload) };
    case 'SET_REMOVED_IMAGE':
      return { ...state, removedImage: action.payload, newImage: null };
    case 'SET_REMOVED_VIDEO':
      return {
        ...state,
        removedVideo: action.payload,
        newVideo: null,
        isYouTubeVideo: false,
        youTubeUrl: '',
      };
    default:
      return state;
  }
}

const EditFeatureStory = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const q = query(collection(db, 'featureStories'));
      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dispatch({ type: 'SET_STORIES', payload: storiesData });
    } catch (err) {
      console.error("Error fetching stories: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to fetch stories. Please try again." });
    }
  };

  const handleEdit = (story) => {
    dispatch({ type: 'SET_EDITING_STORY', payload: story });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch({ type: 'SET_NEW_IMAGE', payload: file });
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch({ type: 'SET_NEW_VIDEO', payload: file });
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

  const handleAddTag = () => {
    if (state.newTag.trim() && !state.tags.includes(state.newTag.trim())) {
      dispatch({ type: 'ADD_TAG', payload: state.newTag.trim() });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    dispatch({ type: 'REMOVE_TAG', payload: tagToRemove });
  };

  const handleRemoveImage = () => {
    dispatch({ type: 'SET_REMOVED_IMAGE', payload: true });
  };

  const handleRemoveVideo = () => {
    dispatch({ type: 'SET_REMOVED_VIDEO', payload: true });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    if (state.editingStory.title.trim().length < 3) {
      dispatch({ type: 'SET_ERROR', payload: "Title must be at least 3 characters long." });
      return;
    }

    if (state.editingStory.content.trim().length < 50) {
      dispatch({ type: 'SET_ERROR', payload: "Content must be at least 50 characters long." });
      return;
    }

    if (state.isYouTubeVideo && !validateYouTubeUrl(state.youTubeUrl)) {
      dispatch({ type: 'SET_ERROR', payload: "Please enter a valid YouTube URL." });
      return;
    }

    try {
      const storyRef = doc(db, 'featureStories', state.editingStory.id);
      let updateData = {
        title: state.editingStory.title.trim(),
        content: state.editingStory.content.trim(),
        tags: state.tags,
        updatedAt: new Date()
      };

      // Handle image updates
      if (state.removedImage && !state.newImage) {
        updateData.imageUrl = null;
      } else if (state.newImage) {
        const imageRef = ref(storage, `feature_story_images/${Date.now()}_${state.newImage.name}`);
        await uploadBytes(imageRef, state.newImage);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
      }

      // Handle video updates
      if (state.removedVideo && !state.newVideo && !state.isYouTubeVideo) {
        updateData.videoUrl = null;
        updateData.isYouTubeVideo = false;
      } else if (state.isYouTubeVideo && state.youTubeUrl) {
        updateData.videoUrl = state.youTubeUrl;
        updateData.isYouTubeVideo = true;
      } else if (state.newVideo) {
        const videoRef = ref(storage, `feature_story_videos/${Date.now()}_${state.newVideo.name}`);
        await uploadBytes(videoRef, state.newVideo);
        const videoUrl = await getDownloadURL(videoRef);
        updateData.videoUrl = videoUrl;
        updateData.isYouTubeVideo = false;
      }

      await updateDoc(storyRef, updateData);

      // Clean up old files if they were replaced or removed
      if ((state.removedImage || state.newImage) && state.editingStory.imageUrl) {
        const oldImageRef = ref(storage, state.editingStory.imageUrl);
        await deleteObject(oldImageRef);
      }

      if ((state.removedVideo || state.newVideo || (state.isYouTubeVideo && state.youTubeUrl)) && state.editingStory.videoUrl && !state.editingStory.isYouTubeVideo) {
        const oldVideoRef = ref(storage, state.editingStory.videoUrl);
        await deleteObject(oldVideoRef);
      }

      dispatch({ type: 'SET_EDITING_STORY', payload: null });
      fetchStories();
    } catch (err) {
      console.error("Error updating story: ", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to update story. Please try again." });
    }
  };

  const handleDelete = async (selectedStory) => {
    if (window.confirm("Are you sure you want to delete this feature story?")) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        if (selectedStory.imageUrl) {
          const imageRef = ref(storage, selectedStory.imageUrl);
          await deleteObject(imageRef);
        }
        if (selectedStory.videoUrl && !selectedStory.isYouTubeVideo) {
          const videoRef = ref(storage, selectedStory.videoUrl);
          await deleteObject(videoRef);
        }

        await deleteDoc(doc(db, 'featureStories', selectedStory.id));

        const batch = writeBatch(db);
        const tagsQuery = query(collection(db, 'tags'));
        const tagsSnapshot = await getDocs(tagsQuery);
        tagsSnapshot.forEach((tagDoc) => {
          const tagData = tagDoc.data();
          if (tagData.storyIds && tagData.storyIds.includes(selectedStory.id)) {
            const updatedStoryIds = tagData.storyIds.filter(id => id !== selectedStory.id);
            if (updatedStoryIds.length === 0) {
              batch.delete(tagDoc.ref);
            } else {
              batch.update(tagDoc.ref, { storyIds: updatedStoryIds });
            }
          }
        });
        await batch.commit();

        fetchStories();
      } catch (err) {
        console.error("Error deleting story: ", err);
        dispatch({ type: 'SET_ERROR', payload: "Failed to delete story. Please try again." });
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
          Edit Feature Stories
        </h1>
        {state.editingStory ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={state.editingStory.title}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_STORY', payload: { title: e.target.value } })}
                required
                minLength={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="content" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Content</label>
              <textarea
                id="content"
                value={state.editingStory.content}
                onChange={(e) => dispatch({ type: 'UPDATE_EDITING_STORY', payload: { content: e.target.value } })}
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
              {state.editingStory.imageUrl && !state.removedImage && (
                <div className="mb-2">
                  <img src={state.editingStory.imageUrl} alt="Current" className="w-32 h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={`mt-2 px-2 py-1 rounded ${
                      darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                    } text-white transition duration-300`}
                  >
                    Remove Image
                  </button>
                </div>
              )}
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
                  checked={state.isYouTubeVideo}
                  onChange={(e) => {
                    dispatch({ type: 'SET_IS_YOUTUBE_VIDEO', payload: e.target.checked });
                    if (!e.target.checked) {
                      dispatch({ type: 'SET_YOUTUBE_URL', payload: '' });
                    }
                  }}
                  className="mr-2"
                />
                YouTube Video
              </label>
              {state.isYouTubeVideo ? (
                <div>
                  <div className="flex mb-2">
                    <input
                      type="url"
                      value={state.youTubeUrl}
                      onChange={(e) => dispatch({ type: 'SET_YOUTUBE_URL', payload: e.target.value })}
                      placeholder="Enter YouTube URL"
                      className={`flex-grow px-3 py-2 border rounded-l-md ${
                        darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className={`px-4 py-2 rounded-r-md ${
                        darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      Remove
                    </button>
                  </div>
                  {state.youTubeUrl && (
                    <div className="mt-2">
                      <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${extractYoutubeId(state.youTubeUrl)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {state.editingStory.videoUrl && !state.removedVideo && !state.isYouTubeVideo && (
                    <div className="mb-2">
                      <video src={state.editingStory.videoUrl} className="w-64 rounded" controls />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className={`mt-2 px-2 py-1 rounded ${
                          darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        } text-white transition duration-300`}
                      >
                        Remove Video
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleVideoChange}
                    accept="video/*"
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="tags" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Tags</label>
              <div className="flex flex-wrap mb-2">
                {state.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className={`${
                      darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    } px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 flex items-center`}
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)} 
                      className="ml-1 focus:outline-none"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={state.newTag}
                  onChange={(e) => dispatch({ type: 'SET_NEW_TAG', payload: e.target.value })}
                  placeholder="Add a tag"
                  className={`flex-grow px-3 py-2 border rounded-l-md ${
                    darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={`px-4 py-2 rounded-r-md ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  Add Tag
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_EDITING_STORY', payload: null })}
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
                Update Story
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {state.stories.map((story) => (
              <div key={story.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{story.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{story.content.substring(0, 150)}...</p>
                <div className="mb-4">
                  {story.tags && story.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`inline-block px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleEdit(story)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(story)}
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

export default EditFeatureStory;