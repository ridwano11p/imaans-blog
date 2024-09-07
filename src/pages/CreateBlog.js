import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaImage, FaFilePdf, FaVideo, FaTimes, FaSpinner, FaLink } from 'react-icons/fa';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateBlog = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLinkedVideo, setIsLinkedVideo] = useState(false);
  const [videoLink, setVideoLink] = useState('');

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to create a blog post.');
      return;
    }

    setLoading(true);

    try {
      // Upload files if they exist
      const imageUrl = image ? await uploadFile(image, 'images') : null;
      const pdfUrl = pdf ? await uploadFile(pdf, 'pdfs') : null;
      let videoUrl = null;

      if (isLinkedVideo) {
        videoUrl = videoLink;
      } else if (video) {
        videoUrl = await uploadFile(video, 'videos');
      }

      // Create new blog post document
      const newBlog = {
        title: title.trim(),
        titleLower: title.trim().toLowerCase(),
        author: author.trim() || user.displayName || 'Anonymous',
        date,
        content,
        imageUrl,
        pdfUrl,
        videoUrl,
        isLinkedVideo,
        createdAt: new Date(),
        createdBy: user.email,
      };

      // Add the blog post to Firestore
      const docRef = await addDoc(collection(db, 'blogs'), newBlog);
      console.log('New blog created with ID:', docRef.id);

      // Clear the form and navigate to home page
      clearForm();
      navigate('/');
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Error creating blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, folder) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleFileUpload = (e, setFile, inputRef) => {
    const file = e.target.files[0];
    setFile(file);
    setUnsavedChanges(true);
    inputRef.current.value = ''; // Reset the input value to allow re-uploading the same file
  };

  const removeFile = (setFile) => {
    setFile(null);
    setUnsavedChanges(true);
  };

  const clearForm = () => {
    setTitle('');
    setAuthor('');
    setContent('');
    setDate('');
    setImage(null);
    setPdf(null);
    setVideo(null);
    setIsLinkedVideo(false);
    setVideoLink('');
    setUnsavedChanges(false);
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (confirmCancel) {
        clearForm();
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleInputChange = (e, setter) => {
    setter(e.target.value);
    setUnsavedChanges(true);
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Create Blog</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => handleInputChange(e, setTitle)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                  : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-2">Author</label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => handleInputChange(e, setAuthor)}
              placeholder="Enter author name (optional)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                  : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => handleInputChange(e, setDate)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                  : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => handleInputChange(e, setContent)}
              required
              rows="10"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                  : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
              }`}
            ></textarea>
          </div>
          <div className="flex justify-between">
            <div>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, setImage, imageInputRef)}
                className="hidden"
                ref={imageInputRef}
              />
              <label
                htmlFor="image"
                className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300`}
              >
                <FaImage className="mr-2" /> Upload Image
              </label>
              {image && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm mr-2">{image.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(setImage)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                id="pdf"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, setPdf, pdfInputRef)}
                className="hidden"
                ref={pdfInputRef}
              />
              <label
                htmlFor="pdf"
                className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                  darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                } text-white transition duration-300`}
              >
                <FaFilePdf className="mr-2" /> Upload PDF
              </label>
              {pdf && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm mr-2">{pdf.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(setPdf)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isLinkedVideo"
                  checked={isLinkedVideo}
                  onChange={() => {
                    setIsLinkedVideo(!isLinkedVideo);
                    setVideo(null);
                    setVideoLink('');
                  }}
                  className="mr-2"
                />
                <label htmlFor="isLinkedVideo" className="text-sm">Upload linked video</label>
              </div>
              {isLinkedVideo ? (
                <div>
                  <input
                    type="text"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="Enter YouTube video URL"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                      darkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    id="video"
                    accept="video/mp4,video/x-m4v,video/*"
                    onChange={(e) => handleFileUpload(e, setVideo, videoInputRef)}
                    className="hidden"
                    ref={videoInputRef}
                  />
                  <label
                    htmlFor="video"
                    className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                      darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                    } text-white transition duration-300`}
                  >
                    <FaVideo className="mr-2" /> Upload Video
                  </label>
                  {video && (
                    <div className="mt-2 flex items-center">
                      <span className="text-sm mr-2">{video.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(setVideo)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className={`px-4 py-2 rounded ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
              } text-white transition duration-300`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded ${
                darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white transition duration-300 flex items-center`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Blog'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
