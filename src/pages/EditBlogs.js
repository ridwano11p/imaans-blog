import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db, storage } from '../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaEdit, FaTrash, FaSpinner, FaImage, FaFilePdf, FaVideo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const EditBlogs = () => {
  const { theme, darkMode } = useContext(ThemeContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

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
      console.error("Error fetching blogs: ", error);
    }
    setLoading(false);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setAuthor(blog.author);
    setContent(blog.content);
    setDate(blog.date);
    setShowEditModal(true);
  };

  const handleDelete = (blogId) => {
    setDeletingBlogId(blogId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletingBlogId) {
      try {
        await deleteDoc(doc(db, 'blogs', deletingBlogId));
        setBlogs(blogs.filter(blog => blog.id !== deletingBlogId));
      } catch (error) {
        console.error("Error deleting blog: ", error);
      }
    }
    setShowDeleteModal(false);
    setDeletingBlogId(null);
  };

  const handleFileUpload = (e, setFile) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleSaveChanges = async () => {
    if (editingBlog) {
      try {
        const blogRef = doc(db, 'blogs', editingBlog.id);
        const updatedBlog = {
          title,
          author,
          content,
          date
        };

        if (image) {
          const imageUrl = await uploadFile(image, 'images');
          updatedBlog.imageUrl = imageUrl;
        }
        if (pdf) {
          const pdfUrl = await uploadFile(pdf, 'pdfs');
          updatedBlog.pdfUrl = pdfUrl;
        }
        if (video) {
          const videoUrl = await uploadFile(video, 'videos');
          updatedBlog.videoUrl = videoUrl;
        }

        await updateDoc(blogRef, updatedBlog);
        setShowEditModal(false);
        setShowConfirmModal(true);
        fetchBlogs(); // Refresh the list
      } catch (error) {
        console.error("Error updating blog: ", error);
      }
    }
  };

  const uploadFile = async (file, folder) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const clearForm = () => {
    setTitle('');
    setAuthor('');
    setContent('');
    setDate('');
    setImage(null);
    setPdf(null);
    setVideo(null);
    setEditingBlog(null);
  };

  const getFileName = (url) => {
    if (!url) return '';
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1].split('?')[0];
  };

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: theme.background, color: theme.text }}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Edit Blogs</h1>

        {loading ? (
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <AnimatePresence>
            <motion.ul className="space-y-4">
              {blogs.map((blog) => (
                <motion.li
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-md`}
                >
                  <span className="text-lg font-medium">{blog.title}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-lg p-8 w-full max-w-4xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <h2 className="text-2xl font-bold mb-4">Edit Blog</h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block mb-1">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="block mb-1">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="6"
                    className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  ></textarea>
                </div>
                <div className="flex justify-between">
                  <div>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setImage)}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition duration-300"
                    >
                      <FaImage className="mr-2" /> Upload Image
                    </label>
                    {(image || editingBlog?.imageUrl) && (
                      <p className="mt-2 text-sm">
                        {image ? image.name : getFileName(editingBlog.imageUrl)}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="pdf"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, setPdf)}
                      className="hidden"
                    />
                    <label
                      htmlFor="pdf"
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600 transition duration-300"
                    >
                      <FaFilePdf className="mr-2" /> Upload PDF
                    </label>
                    {(pdf || editingBlog?.pdfUrl) && (
                      <p  className="mt-2 text-sm">
                        {pdf ? pdf.name : getFileName(editingBlog.pdfUrl)}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="video"
                      accept="video/mp4,video/x-m4v,video/*"
                      onChange={(e) => handleFileUpload(e, setVideo)}
                      className="hidden"
                    />
                    <label
                      htmlFor="video"
                      className="flex items-center px-4 py-2 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600 transition duration-300"
                    >
                      <FaVideo className="mr-2" /> Upload Video
                    </label>
                    {(video || editingBlog?.videoUrl) && (
                      <p className="mt-2 text-sm">
                        {video ? video.name : getFileName(editingBlog.videoUrl)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      clearForm();
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
              <p>Are you sure you want to delete this blog?</p>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal after Edit */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <h2 className="text-2xl font-bold mb-4">Blog Updated</h2>
              <p>Do you want to go to the home page to see the updated blog?</p>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    // Navigate to home page
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditBlogs;
