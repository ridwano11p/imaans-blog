import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaImage, FaFilePdf, FaVideo } from 'react-icons/fa';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateBlog = () => {
  const { theme, darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [video, setVideo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to create a blog post.');
      return;
    }

    try {
      // Upload files if they exist
      const imageUrl = image ? await uploadFile(image, 'images') : null;
      const pdfUrl = pdf ? await uploadFile(pdf, 'pdfs') : null;
      const videoUrl = video ? await uploadFile(video, 'videos') : null;

      // Create new blog post document
      const newBlog = {
        title,
        author: author || 'Anonymous',
        date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
        content,
        imageUrl,
        pdfUrl,
        videoUrl,
        createdAt: new Date(),
        createdBy: user.email,
      };

      // Add the blog post to Firestore
      const docRef = await addDoc(collection(db, 'blogs'), newBlog);
      console.log('New blog created with ID:', docRef.id);

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Error creating blog post. Please try again.');
    }
  };

  const uploadFile = async (file, folder) => {
    const storageRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleFileUpload = (e, setFile) => {
    const file = e.target.files[0];
    setFile(file);
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: theme.background, color: theme.text }}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Create Blog</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block font-medium">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                  : 'bg-white text-black border-blue-500 focus:border-blue-300'
              }`}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="author" className="block font-medium">Author</label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name (optional)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                  : 'bg-white text-black border-blue-500 focus:border-blue-300'
              }`}
            />
          </div>
          <div className="flex space-x-4">
            <div className="space-y-2 flex-1">
              <label htmlFor="year" className="block font-medium">Year</label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                min="1900"
                max="2100"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                    : 'bg-white text-black border-blue-500 focus:border-blue-300'
                }`}
              />
            </div>
            <div className="space-y-2 flex-1">
              <label htmlFor="month" className="block font-medium">Month</label>
              <input
                type="number"
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                min="1"
                max="12"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                    : 'bg-white text-black border-blue-500 focus:border-blue-300'
                }`}
              />
            </div>
            <div className="space-y-2 flex-1">
              <label htmlFor="day" className="block font-medium">Day</label>
              <input
                type="number"
                id="day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                required
                min="1"
                max="31"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                    : 'bg-white text-black border-blue-500 focus:border-blue-300'
                }`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="content" className="block font-medium">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="10"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                  : 'bg-white text-black border-blue-500 focus:border-blue-300'
              }`}
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
                className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                  darkMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <FaImage className="mr-2" /> Upload Image
              </label>
              {image && <p className="mt-2 text-sm">{image.name}</p>}
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
                className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                  darkMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <FaFilePdf className="mr-2" /> Upload PDF
              </label>
              {pdf && <p className="mt-2 text-sm">{pdf.name}</p>}
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
                className={`flex items-center px-4 py-2 rounded cursor-pointer ${
                  darkMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <FaVideo className="mr-2" /> Upload Video
              </label>
              {video && <p className="mt-2 text-sm">{video.name}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'
              } text-white`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              Post Blog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
