import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const EditPhoto = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [newPhotoFile, setNewPhotoFile] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchPhotos();
    }
  }, [user, navigate]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'photos'));
      const querySnapshot = await getDocs(q);
      const fetchedPhotos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(fetchedPhotos);
    } catch (err) {
      console.error("Error fetching photos: ", err);
      setError("Failed to fetch photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (photo) => {
    setEditingPhoto(photo);
    setNewPhotoFile(null);
  };

  const handlePhotoChange = async (e) => {
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
        setNewPhotoFile(compressedFile);
      } catch (err) {
        console.error("Error compressing image: ", err);
        setError("Failed to process image. Please try again.");
      }
    }
  };

  const validateForm = () => {
    if (editingPhoto.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      return false;
    }
    if (editingPhoto.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return false;
    }
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    try {
      const photoRef = doc(db, 'photos', editingPhoto.id);
      let updateData = {
        title: editingPhoto.title.trim(),
        description: editingPhoto.description.trim(),
        updatedAt: new Date()
      };

      if (newPhotoFile) {
        // Delete old photo if it exists
        if (editingPhoto.photoUrl) {
          const oldPhotoRef = ref(storage, editingPhoto.photoUrl);
          await deleteObject(oldPhotoRef);
        }

        const fileName = `${Date.now()}_${newPhotoFile.name}`;
        const photoFileRef = ref(storage, `gallery_photos/${fileName}`);
        await uploadBytes(photoFileRef, newPhotoFile);
        const photoUrl = await getDownloadURL(photoFileRef);
        updateData.photoUrl = photoUrl;
        updateData.fileName = fileName;
      }

      await updateDoc(photoRef, updateData);
      setEditingPhoto(null);
      fetchPhotos();
    } catch (err) {
      console.error("Error updating photo: ", err);
      setError("Failed to update photo. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (window.confirm("Are you sure you want to delete this photo?")) {
      setUpdating(true);
      try {
        const photoToDelete = photos.find(p => p.id === photoId);
        if (photoToDelete.photoUrl) {
          const photoRef = ref(storage, photoToDelete.photoUrl);
          await deleteObject(photoRef);
        }
        await deleteDoc(doc(db, 'photos', photoId));

        // Check if this was the last item in the collection
        const photosSnapshot = await getDocs(collection(db, 'photos'));
        if (photosSnapshot.empty) {
          // If the collection is now empty, delete the entire 'gallery_photos' folder in Storage
          const galleryRef = ref(storage, 'gallery_photos');
          const photosList = await listAll(galleryRef);
          await Promise.all(photosList.items.map(item => deleteObject(item)));
        }

        fetchPhotos();
      } catch (err) {
        console.error("Error deleting photo: ", err);
        setError("Failed to delete photo. Please try again.");
      } finally {
        setUpdating(false);
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

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit Photos
        </h1>
        {error && (
          <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
        {editingPhoto ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={editingPhoto.title}
                onChange={(e) => setEditingPhoto({...editingPhoto, title: e.target.value})}
                required
                minLength={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="description" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Description</label>
              <textarea
                id="description"
                value={editingPhoto.description}
                onChange={(e) => setEditingPhoto({...editingPhoto, description: e.target.value})}
                required
                minLength={10}
                rows="5"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="photo" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Photo (Optional)</label>
              <input
                type="file"
                id="photo"
                onChange={handlePhotoChange}
                accept="image/*"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                } text-gray-800 transition duration-300`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? <FaSpinner className="animate-spin mx-auto" /> : 'Update Photo'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <img src={photo.photoUrl} alt={photo.title} className="w-full h-48 object-cover rounded-md mb-4" />
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{photo.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{photo.description}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleEdit(photo)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
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

export default EditPhoto;