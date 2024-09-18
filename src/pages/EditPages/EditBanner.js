import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ThemeContext } from '../../context/ThemeContext';

const EditBanner = () => {
  const [bannerId, setBannerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchBannerContent = async () => {
      try {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const bannerData = querySnapshot.docs[0].data();
          setBannerId(querySnapshot.docs[0].id);
          setTitle(bannerData.title);
          setDescription(bannerData.description);
          setCurrentImageUrl(bannerData.imageUrl);
        }
      } catch (err) {
        console.error("Error fetching banner content: ", err);
      }
    };

    fetchBannerContent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = currentImageUrl;
      if (newImage) {
        const storageRef = ref(storage, `banners/${newImage.name}`);
        await uploadBytes(storageRef, newImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'banners', bannerId), {
        title,
        description,
        imageUrl,
      });

      setLoading(false);
      navigate('/');
    } catch (error) {
      console.error('Error updating banner: ', error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-6">Edit Banner</h1>
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
            <label htmlFor="image" className="block mb-2">Current Image</label>
            {currentImageUrl && <img src={currentImageUrl} alt="Current Banner" className="w-full mb-2 rounded" />}
            <input
              type="file"
              id="image"
              onChange={(e) => setNewImage(e.target.files[0])}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              accept="image/*"
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Banner'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditBanner;