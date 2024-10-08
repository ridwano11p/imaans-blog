import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';

const EditPhoto = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [removedImage, setRemovedImage] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

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
      setLoading(false);
    } catch (err) {
      console.error("Error fetching photos: ", err);
      setError("Failed to fetch photos. Please try again.");
      setLoading(false);
    }
  };

  const handleEdit = (photo) => {
    setEditingPhoto({...photo, tempPhotoUrl: photo.photoUrl});
    setNewImage(null);
    setRemovedImage(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setRemovedImage(false);
    }
  };

  const handleRemoveImage = () => {
    setRemovedImage(true);
    setNewImage(null);
    setEditingPhoto({...editingPhoto, tempPhotoUrl: null});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingPhoto.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    try {
      const photoRef = doc(db, 'photos', editingPhoto.id);
      let updateData = {
        title: editingPhoto.title.trim(),
        description: editingPhoto.description.trim(),
        updatedAt: new Date()
      };

      // Handle image updates
      if (removedImage && !newImage) {
        updateData.photoUrl = null;
      } else if (newImage) {
        const imageRef = ref(storage, `photos/${Date.now()}_${newImage.name}`);
        await uploadBytes(imageRef, newImage);
        const photoUrl = await getDownloadURL(imageRef);
        updateData.photoUrl = photoUrl;
      }

      await updateDoc(photoRef, updateData);

      // Clean up old files if they were replaced or removed
      if ((removedImage || newImage) && editingPhoto.photoUrl) {
        await deleteObject(ref(storage, editingPhoto.photoUrl));
      }

      setEditingPhoto(null);
      fetchPhotos();
    } catch (err) {
      console.error("Error updating photo: ", err);
      setError("Failed to update photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (window.confirm("Are you sure you want to delete this photo?")) {
      setLoading(true);
      try {
        const photoToDelete = photos.find(photo => photo.id === photoId);
        if (photoToDelete.photoUrl) {
          await deleteObject(ref(storage, photoToDelete.photoUrl));
        }

        await deleteDoc(doc(db, 'photos', photoId));

        const photosSnapshot = await getDocs(collection(db, 'photos'));
        if (photosSnapshot.empty) {
          const folderRef = ref(storage, 'photos');
          const listResult = await listAll(folderRef);
          const deletePromises = listResult.items.map(item => deleteObject(item));
          await Promise.all(deletePromises);
        }

        fetchPhotos();
      } catch (err) {
        console.error("Error deleting photo: ", err);
        setError("Failed to delete photo. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit Photos
        </h1>
        {photos.length === 0 ? (
          <div className={`text-center mt-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No photos created
          </div>
        ) : editingPhoto ? (
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
                rows="4"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="image" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Image</label>
              {editingPhoto.tempPhotoUrl && !removedImage && (
                <div className="mb-2">
                  <img src={editingPhoto.tempPhotoUrl} alt={editingPhoto.title} className="w-32 h-32 object-cover rounded" />
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
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300`}
              >
                Update Photo
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <img src={photo.photoUrl} alt={photo.title} className="w-full h-48 object-cover rounded mb-4" />
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{photo.title}</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{photo.description}</p>
                <div className="flex justify-end space-x-4">
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