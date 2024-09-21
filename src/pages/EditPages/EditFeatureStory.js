import React, { useState, useEffect, useContext } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const EditFeatureStory = () => {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      const q = query(collection(db, 'featureStories'));
      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData);
    };

    fetchStories();
  }, []);

  const handleStorySelect = (story) => {
    setSelectedStory(story);
    setTitle(story.title);
    setContent(story.content);
    setAuthor(story.author || '');
    setTags(story.tags || []);
    setIsYouTubeVideo(story.isYouTubeVideo || false);
    setYouTubeUrl(story.videoUrl || '');
    setRemoveImage(false);
    setRemoveVideo(false);
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

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleRemoveYouTubeVideo = () => {
    setYouTubeUrl('');
    setIsYouTubeVideo(false);
    setRemoveVideo(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (content.trim().length < 50) {
      setError("Content must be at least 50 characters long.");
      setLoading(false);
      return;
    }

    if (author.trim().length < 2) {
      setError("Author name must be at least 2 characters long.");
      setLoading(false);
      return;
    }

    if (isYouTubeVideo && !validateYouTubeUrl(youTubeUrl)) {
      setError("Please enter a valid YouTube URL.");
      setLoading(false);
      return;
    }

    try {
      const storyRef = doc(db, 'featureStories', selectedStory.id);
      let updateData = {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        tags,
        isYouTubeVideo,
        updatedAt: new Date()
      };

      if (removeImage) {
        if (selectedStory.imageUrl) {
          const oldImageRef = ref(storage, selectedStory.imageUrl);
          await deleteObject(oldImageRef);
        }
        updateData.imageUrl = null;
      } else if (image) {
        if (selectedStory.imageUrl) {
          const oldImageRef = ref(storage, selectedStory.imageUrl);
          await deleteObject(oldImageRef);
        }
        const imageRef = ref(storage, `featureStories/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
      }

      if (removeVideo) {
        if (selectedStory.videoUrl && !selectedStory.isYouTubeVideo) {
          const oldVideoRef = ref(storage, selectedStory.videoUrl);
          await deleteObject(oldVideoRef);
        }
        updateData.videoUrl = null;
        updateData.youtubeId = null;
        updateData.isYouTubeVideo = false;
      } else if (isYouTubeVideo && youTubeUrl) {
        updateData.videoUrl = youTubeUrl;
        updateData.youtubeId = extractYoutubeId(youTubeUrl);
        if (selectedStory.videoUrl && !selectedStory.isYouTubeVideo) {
          const oldVideoRef = ref(storage, selectedStory.videoUrl);
          await deleteObject(oldVideoRef);
        }
      } else if (video) {
        if (selectedStory.videoUrl) {
          const oldVideoRef = ref(storage, selectedStory.videoUrl);
          await deleteObject(oldVideoRef);
        }
        const videoRef = ref(storage, `featureStories/${Date.now()}_${video.name}`);
        await uploadBytes(videoRef, video);
        const videoUrl = await getDownloadURL(videoRef);
        updateData.videoUrl = videoUrl;
        updateData.youtubeId = null;
        updateData.isYouTubeVideo = false;
      }

      await updateDoc(storyRef, updateData);

      setLoading(false);
      navigate('/');
    } catch (err) {
      setError('Failed to update feature story. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this feature story?')) {
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

        setStories(stories.filter(story => story.id !== selectedStory.id));
        setSelectedStory(null);
        setTitle('');
        setContent('');
        setAuthor('');
        setTags([]);
      } catch (err) {
        setError('Failed to delete feature story. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Edit Feature Story</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Select a story to edit:</h2>
          <select
            onChange={(e) => handleStorySelect(stories.find(s => s.id === e.target.value))}
            className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
          >
            <option value="">Select a story</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </select>
        </div>
        {selectedStory && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-2">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              />
            </div>
            <div>
              <label htmlFor="author" className="block mb-2">Author</label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              />
            </div>
            <div>
              <label htmlFor="content" className="block mb-2">Content</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows="6"
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="image" className="block mb-2">Image</label>
              {selectedStory.imageUrl && !removeImage && (
                <div className="mb-2">
                  <img src={selectedStory.imageUrl} alt="Current" className="w-32 h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setRemoveImage(true)}
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
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
                className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`flex items-center mb-2`}>
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
                      className={`flex-grow p-2 rounded-l ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveYouTubeVideo}
                      className={`px-4 py-2 rounded-r ${
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
                  {selectedStory.videoUrl && !removeVideo && (
                    <div className="mb-2">
                      <video src={selectedStory.videoUrl} className="w-64 rounded" controls />
                      <button
                        type="button"
                        onClick={() => setRemoveVideo(true)}
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
                    onChange={(e) => {
                      setVideo(e.target.files[0]);
                      setIsYouTubeVideo(false);
                      setYouTubeUrl('');
                    }}
                    accept="video/*"
                    className={`w-full p-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="tags" className="block mb-2">Tags</label>
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
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              >
                {loading ? 'Updating...' : 'Update Feature Story'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                Delete Feature Story
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditFeatureStory;