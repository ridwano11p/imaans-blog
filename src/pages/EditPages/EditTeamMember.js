import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaLinkedin, FaTwitter, FaYoutube, FaFacebook } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

const EditTeamMember = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchTeamMembers();
    }
  }, [user, navigate]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'team_members'));
      const querySnapshot = await getDocs(q);
      const fetchedMembers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamMembers(fetchedMembers);
    } catch (err) {
      console.error("Error fetching team members: ", err);
      setError("Failed to fetch team members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setNewImage(null);
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
          maxWidthOrHeight: 800
        });
        setNewImage(compressedFile);
      } catch (err) {
        console.error("Error compressing image: ", err);
        setError("Failed to process image. Please try again.");
      }
    }
  };

  const validateForm = () => {
    if (editingMember.name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return false;
    }
    if (editingMember.role.trim().length < 2) {
      setError("Role must be at least 2 characters long.");
      return false;
    }
    if (editingMember.bio.trim().length < 10) {
      setError("Bio must be at least 10 characters long.");
      return false;
    }
    if (editingMember.linkedin && !isValidUrl(editingMember.linkedin)) {
      setError("Please enter a valid LinkedIn URL.");
      return false;
    }
    if (editingMember.twitter && !isValidUrl(editingMember.twitter)) {
      setError("Please enter a valid Twitter URL.");
      return false;
    }
    if (editingMember.youtube && !isValidUrl(editingMember.youtube)) {
      setError("Please enter a valid YouTube URL.");
      return false;
    }
    if (editingMember.facebook && !isValidUrl(editingMember.facebook)) {
      setError("Please enter a valid Facebook URL.");
      return false;
    }
    return true;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    try {
      const memberRef = doc(db, 'team_members', editingMember.id);
      let updateData = {
        name: editingMember.name.trim(),
        role: editingMember.role.trim(),
        bio: editingMember.bio.trim(),
        linkedin: editingMember.linkedin?.trim() || '',
        twitter: editingMember.twitter?.trim() || '',
        youtube: editingMember.youtube?.trim() || '',
        facebook: editingMember.facebook?.trim() || '',
        updatedAt: new Date()
      };

      if (newImage) {
        // Delete old image if it exists
        if (editingMember.imageUrl) {
          const oldImageRef = ref(storage, editingMember.imageUrl);
          await deleteObject(oldImageRef);
        }

        const fileName = `${Date.now()}_${newImage.name}`;
        const imageRef = ref(storage, `team_member_images/${fileName}`);
        await uploadBytes(imageRef, newImage);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
      }

      await updateDoc(memberRef, updateData);
      setEditingMember(null);
      fetchTeamMembers();
    } catch (err) {
      console.error("Error updating team member: ", err);
      setError("Failed to update team member. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this team member?")) {
      setUpdating(true);
      try {
        const memberToDelete = teamMembers.find(member => member.id === memberId);
        if (memberToDelete.imageUrl) {
          const imageRef = ref(storage, memberToDelete.imageUrl);
          await deleteObject(imageRef);
        }
        await deleteDoc(doc(db, 'team_members', memberId));

        // Check if this was the last item in the collection
        const membersSnapshot = await getDocs(collection(db, 'team_members'));
        if (membersSnapshot.empty) {
          // If the collection is now empty, delete the entire 'team_member_images' folder in Storage
          const imagesRef = ref(storage, 'team_member_images');
          const imagesList = await listAll(imagesRef);
          await Promise.all(imagesList.items.map(item => deleteObject(item)));
        }

        fetchTeamMembers();
      } catch (err) {
        console.error("Error deleting team member: ", err);
        setError("Failed to delete team member. Please try again.");
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
          Edit Team Members
        </h1>
        {error && (
          <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
        {editingMember ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="name" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Name</label>
              <input
                type="text"
                id="name"
                value={editingMember.name}
                onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                required
                minLength={2}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="role" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Role</label>
              <input
                type="text"
                id="role"
                value={editingMember.role}
                onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                required
                minLength={2}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="bio" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Bio</label>
              <textarea
                id="bio"
                value={editingMember.bio}
                onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})}
                required
                minLength={10}
                rows="5"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="image" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New Profile Image (Optional)</label>
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
              <label htmlFor="linkedin" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>LinkedIn URL</label>
              <input
                type="url"
                id="linkedin"
                value={editingMember.linkedin || ''}
                onChange={(e) => setEditingMember({...editingMember, linkedin: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="twitter" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Twitter URL</label>
              <input
                type="url"
                id="twitter"
                value={editingMember.twitter || ''}
                onChange={(e) => setEditingMember({...editingMember, twitter: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="youtube" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>YouTube URL</label>
              <input
                type="url"
                id="youtube"
                value={editingMember.youtube || ''}
                onChange={(e) => setEditingMember({...editingMember, youtube: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="facebook" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Facebook URL</label>
              <input
                type="url"
                id="facebook"
                value={editingMember.facebook || ''}
                onChange={(e) => setEditingMember({...editingMember, facebook: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
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
                {updating ? <FaSpinner className="animate-spin mx-auto" /> : 'Update Team Member'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                <h2 className={`text-2xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</h2>
                <p className={`text-center mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.role}</p>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>{member.bio}</p>
                <div className="flex justify-center space-x-4 mb-4">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                      <FaLinkedin size={24} />
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-black">
                      <FaTwitter size={24} />
                    </a>
                  )}
                  {member.youtube && (
                    <a href={member.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600">
                      <FaYoutube size={24} />
                    </a>
                  )}
                  {member.facebook && (
                    <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-800">
                      <FaFacebook size={24} />
                    </a>
                  )}
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleEdit(member)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
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

export default EditTeamMember;