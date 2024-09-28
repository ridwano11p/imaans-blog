import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const EditFeatureStory = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [removedImage, setRemovedImage] = useState(false);
  const [removedVideo, setRemovedVideo] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'featureStories'));
      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching stories: ", err);
      setError("Failed to fetch stories. Please try again.");
      setLoading(false);
    }
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setNewImage(null);
    setNewVideo(null);
    setIsYouTubeVideo(story.isYouTubeVideo || false);
    setYouTubeUrl(story.videoUrl || '');
    setTags(story.tags || []);
    setRemovedImage(false);
    setRemovedVideo(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setRemovedImage(false);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVideo(file);
      setRemovedVideo(false);
      setIsYouTubeVideo(false);
      setYouTubeUrl('');
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
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveImage = () => {
    setRemovedImage(true);
    setNewImage(null);
  };

  const handleRemoveVideo = () => {
    setRemovedVideo(true);
    setNewVideo(null);
    setIsYouTubeVideo(false);
    setYouTubeUrl('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingStory.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (editingStory.content.trim().length < 50) {
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
      const storyRef = doc(db, 'featureStories', editingStory.id);
      let updateData = {
        title: editingStory.title.trim(),
        content: editingStory.content.trim(),
        tags,
        updatedAt: new Date()
      };

      // Handle image updates
      if (removedImage && !newImage) {
        updateData.imageUrl = null;
      } else if (newImage) {
        const imageRef = ref(storage, `feature_story_images/${Date.now()}_${newImage.name}`);
        await uploadBytes(imageRef, newImage);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
      }

      // Handle video updates
      if (removedVideo && !newVideo && !isYouTubeVideo) {
        updateData.videoUrl = null;
        updateData.isYouTubeVideo = false;
      } else if (isYouTubeVideo && youTubeUrl) {
        updateData.videoUrl = youTubeUrl;
        updateData.isYouTubeVideo = true;
      } else if (newVideo) {
        const videoRef = ref(storage, `feature_story_videos/${Date.now()}_${newVideo.name}`);
        await uploadBytes(videoRef, newVideo);
        const videoUrl = await getDownloadURL(videoRef);
        updateData.videoUrl = videoUrl;
        updateData.isYouTubeVideo = false;
      }

      await updateDoc(storyRef, updateData);

      // Clean up old files if they were replaced or removed
      if ((removedImage || newImage) && editingStory.imageUrl) {
        const oldImageRef = ref(storage, editingStory.imageUrl);
        await deleteObject(oldImageRef);
      }

      if ((removedVideo || newVideo || (isYouTubeVideo && youTubeUrl)) && editingStory.videoUrl && !editingStory.isYouTubeVideo) {
        const oldVideoRef = ref(storage, editingStory.videoUrl);
        await deleteObject(oldVideoRef);
      }

      setEditingStory(null);
      fetchStories();
    } catch (err) {
      console.error("Error updating story: ", err);
      setError("Failed to update story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (selectedStory) => {
    if (window.confirm("Are you sure you want to delete this feature story?")) {
      setLoading(true);
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
        setError("Failed to delete story. Please try again.");
      } finally {
        setLoading(false);
      }
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
          Edit Feature Stories
        </h1>
        {editingStory ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={editingStory.title}
                onChange={(e) => setEditingStory({...editingStory, title: e.target.value})}
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
                value={editingStory.content}
                onChange={(e) => setEditingStory({...editingStory, content: e.target.value})}
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
              {editingStory.imageUrl && !removedImage && (
                <div className="mb-2">
                  <img src={editingStory.imageUrl} alt="Current" className="w-32 h-32 object-cover rounded" />
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
                  checked={isYouTubeVideo}
                  onChange={(e) => {
                    setIsYouTubeVideo(e.target.checked);
                    if (!e.target.checked) {
                      setYouTubeUrl('');
                    }
                  }}
                  className="mr-2"
                />
                YouTube Video
              </label>
              {isYouTubeVideo ? (
                <div>
                  <div className="flex mb-2">
                    <input
                      type="url"
                      value={youTubeUrl}
                      onChange={(e) => setYouTubeUrl(e.target.value)}
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
                  {youTubeUrl && (
                    <div className="mt-2">
                      <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${extractYoutubeId(youTubeUrl)}`}
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
                  {editingStory.videoUrl && !removedVideo && !isYouTubeVideo && (
                    <div className="mb-2">
                      <video src={editingStory.videoUrl} className="w-64 rounded" controls />
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
                {tags.map((tag, index) => (
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
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
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
                onClick={() => setEditingStory(null)}
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
            {stories.map((story) => (
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