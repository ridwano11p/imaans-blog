import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const EditBlog = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [youTubeUrl, setYouTubeUrl] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'blogs'));
      const querySnapshot = await getDocs(q);
      const fetchedBlogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlogs(fetchedBlogs);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching blogs: ", err);
      setError("Failed to fetch blogs. Please try again.");
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setNewImage(null);
    setNewVideo(null);
    setIsYouTubeVideo(blog.isYouTubeVideo || false);
    setYouTubeUrl(blog.videoUrl || '');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image size should be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
        return;
      }
      
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
          maxWidthOrHeight: 1920
        });
        setNewImage(compressedFile);
      } catch (err) {
        console.error("Error compressing image: ", err);
        setError("Failed to process image. Please try again.");
      }
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_VIDEO_SIZE) {
        setError(`Video size should be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
        return;
      }
      setNewVideo(file);
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
    setLoading(true);
    setError(null);

    if (editingBlog.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (editingBlog.content.trim().length < 50) {
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
      const blogRef = doc(db, 'blogs', editingBlog.id);
      let updateData = {
        title: editingBlog.title.trim(),
        content: editingBlog.content.trim(),
        isYouTubeVideo,
        updatedAt: new Date()
      };

      if (newImage) {
        // Delete old image if it exists
        if (editingBlog.imageUrl) {
          const oldImageRef = ref(storage, editingBlog.imageUrl);
          await deleteObject(oldImageRef);
        }

        const imageRef = ref(storage, `blog_images/${Date.now()}_${newImage.name}`);
        await uploadBytes(imageRef, newImage);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
      }

      if (isYouTubeVideo) {
        updateData.videoUrl = youTubeUrl;
        updateData.youtubeId = extractYoutubeId(youTubeUrl);

        // Delete old video if it exists and it's not a YouTube video
        if (editingBlog.videoUrl && !editingBlog.isYouTubeVideo) {
          const oldVideoRef = ref(storage, editingBlog.videoUrl);
          await deleteObject(oldVideoRef);
        }
      } else if (newVideo) {
        // Delete old video if it exists
        if (editingBlog.videoUrl) {
          const oldVideoRef = ref(storage, editingBlog.videoUrl);
          await deleteObject(oldVideoRef);
        }

        const videoRef = ref(storage, `blog_videos/${Date.now()}_${newVideo.name}`);
        await uploadBytes(videoRef, newVideo);
        const videoUrl = await getDownloadURL(videoRef);
        updateData.videoUrl = videoUrl;
        delete updateData.youtubeId;
      }

      await updateDoc(blogRef, updateData);
      setEditingBlog(null);
      fetchBlogs();
    } catch (err) {
      console.error("Error updating blog: ", err);
      setError("Failed to update blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      setLoading(true);
      try {
        const blogToDelete = blogs.find(blog => blog.id === blogId);
        if (blogToDelete.imageUrl) {
          const imageRef = ref(storage, blogToDelete.imageUrl);
          await deleteObject(imageRef);
        }
        if (blogToDelete.videoUrl && !blogToDelete.isYouTubeVideo) {
          const videoRef = ref(storage, blogToDelete.videoUrl);
          await deleteObject(videoRef);
        }
        await deleteDoc(doc(db, 'blogs', blogId));

        // Check if this was the last item in the collection
        const blogsSnapshot = await getDocs(collection(db, 'blogs'));
        if (blogsSnapshot.empty) {
          // If the collection is now empty, delete the entire 'blog_images' and 'blog_videos' folders in Storage
          const imagesFolderRef = ref(storage, 'blog_images');
          const videosFolderRef = ref(storage, 'blog_videos');

          const deleteFolder = async (folderRef) => {
            const listResult = await listAll(folderRef);
            const deletePromises = listResult.items.map(item => deleteObject(item));
            await Promise.all(deletePromises);
          };

          await deleteFolder(imagesFolderRef);
          await deleteFolder(videosFolderRef);
        }

        fetchBlogs();
      } catch (err) {
        console.error("Error deleting blog: ", err);
        setError("Failed to delete blog. Please try again.");
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
          Edit Blogs
        </h1>
        {editingBlog ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={editingBlog.title}
                onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value})}
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
                value={editingBlog.content}
                onChange={(e) => setEditingBlog({...editingBlog, content: e.target.value})}
                required
                minLength={50}
                rows="10"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="image" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Image</label>
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
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
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
                Update Blog
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {blogs.map((blog) => (
              <div key={blog.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{blog.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{blog.content.substring(0, 150)}...</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleEdit(blog)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
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

export default EditBlog;