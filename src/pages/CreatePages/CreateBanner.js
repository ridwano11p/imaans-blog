import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ThemeContext } from '../../context/ThemeContext';

const CreateBanner = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const storageRef = ref(storage, `banners/${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'banners'), {
        title,
        description,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      navigate('/');
    } catch (error) {
      console.error('Error creating banner: ', error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-6">Create New Banner</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-2">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              rows="4"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="image" className="block mb-2">Image</label>
            <input
              type="file"
              id="image"
              onChange={(e) => setImage(e.target.files[0])}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              accept="image/*"
              required
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Banner'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBanner;