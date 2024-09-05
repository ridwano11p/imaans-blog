import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db, storage } from '../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaEdit, FaTrash, FaTimes, FaSpinner, FaImage, FaFilePdf, FaVideo } from 'react-icons/fa';

const EditBlogs = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [newPdf, setNewPdf] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [removedFiles, setRemovedFiles] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

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

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'blogs'), orderBy('title'));
      const querySnapshot = await getDocs(q);
      const fetchedBlogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
    setLoading(false);
  };

  const handleEdit = (blog) => {
    setEditingBlog({ ...blog });
    setRemovedFiles({});
    setNewImage(null);
    setNewPdf(null);
    setNewVideo(null);
    setShowEditModal(true);
    setUnsavedChanges(false);
  };

  const handleDelete = (blogId) => {
    setDeletingBlogId(blogId);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingBlog(prev => ({ ...prev, [name]: value }));
    setUnsavedChanges(true);
  };

  const handleFileUpload = (e, setFile, fileType, inputRef) => {
    const file = e.target.files[0];
    setFile(file);
    setRemovedFiles(prev => ({ ...prev, [fileType]: false }));
    setUnsavedChanges(true);
    inputRef.current.value = ''; // Reset the input value to allow re-uploading the same file
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const storageRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSaveChanges = async () => {
    try {
      const blogRef = doc(db, 'blogs', editingBlog.id);
      const updatedBlog = { ...editingBlog };

      // Handle image
      if (newImage) {
        if (editingBlog.imageUrl) {
          await deleteObject(ref(storage, editingBlog.imageUrl));
        }
        updatedBlog.imageUrl = await uploadFile(newImage, 'images');
      } else if (removedFiles.image) {
        if (editingBlog.imageUrl) {
          await deleteObject(ref(storage, editingBlog.imageUrl));
        }
        updatedBlog.imageUrl = null;
      }

      // Handle PDF
      if (newPdf) {
        if (editingBlog.pdfUrl) {
          await deleteObject(ref(storage, editingBlog.pdfUrl));
        }
        updatedBlog.pdfUrl = await uploadFile(newPdf, 'pdfs');
      } else if (removedFiles.pdf) {
        if (editingBlog.pdfUrl) {
          await deleteObject(ref(storage, editingBlog.pdfUrl));
        }
        updatedBlog.pdfUrl = null;
      }

      // Handle video
      if (newVideo) {
        if (editingBlog.videoUrl) {
          await deleteObject(ref(storage, editingBlog.videoUrl));
        }
        updatedBlog.videoUrl = await uploadFile(newVideo, 'videos');
      } else if (removedFiles.video) {
        if (editingBlog.videoUrl) {
          await deleteObject(ref(storage, editingBlog.videoUrl));
        }
        updatedBlog.videoUrl = null;
      }

      await updateDoc(blogRef, updatedBlog);
      setShowEditModal(false);
      fetchBlogs();
      setUnsavedChanges(false);

      const shouldNavigate = window.confirm("Blog updated successfully. Do you want to view it on the home page?");
      if (shouldNavigate) {
        navigate('/');
      }
    } catch (error) {
      console.error("Error updating blog:", error);
      alert("Failed to update blog. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const blogRef = doc(db, 'blogs', deletingBlogId);
      const blogToDelete = blogs.find(blog => blog.id === deletingBlogId);

      if (blogToDelete.imageUrl) {
        await deleteObject(ref(storage, blogToDelete.imageUrl));
      }
      if (blogToDelete.pdfUrl) {
        await deleteObject(ref(storage, blogToDelete.pdfUrl));
      }
      if (blogToDelete.videoUrl) {
        await deleteObject(ref(storage, blogToDelete.videoUrl));
      }

      await deleteDoc(blogRef);
      setShowDeleteModal(false);
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog. Please try again.");
    }
  };

  const handleRemoveMedia = (type) => {
    setRemovedFiles(prev => ({ ...prev, [type]: true }));
    setUnsavedChanges(true);
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (confirmCancel) {
        setShowEditModal(false);
        setUnsavedChanges(false);
      }
    } else {
      setShowEditModal(false);
    }
  };

  const getFileName = (url) => {
    if (!url) return '';
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1].split('?')[0];
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Edit Blogs</h1>
        {loading ? (
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <ul className="space-y-4">
            {blogs.map((blog) => (
              <li
                key={blog.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                } transition-all duration-300 hover:shadow-lg`}
              >
                <span className="text-lg font-medium">{blog.title}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(blog)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors duration-300"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-300"
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className={`w-11/12 max-w-3xl p-8 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">Edit Blog</h2>
            <input
              type="text"
              name="title"
              value={editingBlog.title}
              onChange={handleInputChange}
              className={`w-full p-2 mb-4 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
              placeholder="Title"
            />
            <input
              type="text"
              name="author"
              value={editingBlog.author}
              onChange={handleInputChange}
              className={`w-full p-2 mb-4 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
              placeholder="Author"
            />
            <textarea
              name="content"
              value={editingBlog.content}
              onChange={handleInputChange}
              className={`w-full p-2 mb-4 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
              placeholder="Content"
              rows="6"
            ></textarea>
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setNewImage, 'image', imageInputRef)}
                  className="hidden"
                  id="newImage"
                  ref={imageInputRef}
                />
                <label
                  htmlFor="newImage"
                  className={`cursor-pointer px-4 py-2 rounded ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors duration-300`}
                >
                  <FaImage className="mr-2 inline" /> Upload New Image
                </label>
                {(newImage || (editingBlog.imageUrl && !removedFiles.image)) ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      {newImage ? newImage.name : getFileName(editingBlog.imageUrl)}
                    </span>
                    <button
                      onClick={() => {
                        if (newImage) {
                          setNewImage(null);
                        } else {
                          handleRemoveMedia('image');
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, setNewPdf, 'pdf', pdfInputRef)}
                  className="hidden"
                  id="newPdf"
                  ref={pdfInputRef}
                />
                <label
                  htmlFor="newPdf"
                  className={`cursor-pointer px-4 py-2 rounded ${
                    darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors duration-300`}
                >
                  <FaFilePdf className="mr-2 inline" /> Upload New PDF
                </label>
                {(newPdf || (editingBlog.pdfUrl && !removedFiles.pdf)) ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      {newPdf ? newPdf.name : getFileName(editingBlog.pdfUrl)}
                    </span>
                    <button
                      onClick={() => {
                        if (newPdf) {
                          setNewPdf(null);
                        } else {
                          handleRemoveMedia('pdf');
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, setNewVideo, 'video', videoInputRef)}
                  className="hidden"
                  id="newVideo"
                  ref={videoInputRef}
                />
                <label
                  htmlFor="newVideo"
                  className={`cursor-pointer px-4 py-2 rounded ${
                    darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                  } text-white transition-colors duration-300`}
                >
                  <FaVideo className="mr-2 inline" /> Upload New Video
                </label>
                {(newVideo || (editingBlog.videoUrl && !removedFiles.video)) ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      {newVideo ? newVideo.name : getFileName(editingBlog.videoUrl)}
                    </span>
                    <button
                      onClick={() => {
                        if (newVideo) {
                          setNewVideo(null);
                        } else {
                          handleRemoveMedia('video');
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
                } transition-colors duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className={`px-4 py-2 rounded ${
                  darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                } text-white transition-colors duration-300`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className={`w-96 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete this blog?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
                } transition-colors duration-300`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBlogs;
