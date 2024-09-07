import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaUserPlus, FaTimes, FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const EditAbout = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [aboutText, setAboutText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const profilePictureInputRef = useRef(null);

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    youtube: '',
    twitter: '',
    facebook: '',
    instagram: '',
  });

  useEffect(() => {
    fetchAboutText();
    fetchTeamMembers();
  }, []);

  const fetchAboutText = async () => {
    try {
      const aboutDoc = await getDocs(collection(db, 'about'));
      if (!aboutDoc.empty) {
        setAboutText(aboutDoc.docs[0].data().text);
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Error fetching about text:', error);
      setError('Failed to fetch about text. Please try again.');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const teamSnapshot = await getDocs(collection(db, 'team'));
      const members = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to fetch team members. Please try again.');
    }
  };

  const handleSaveAbout = async () => {
    setLoading(true);
    try {
      if (isEditMode) {
        const aboutDoc = await getDocs(collection(db, 'about'));
        await updateDoc(doc(db, 'about', aboutDoc.docs[0].id), { text: aboutText });
      } else {
        await addDoc(collection(db, 'about'), { text: aboutText });
        setIsEditMode(true);
      }
      setError('');
    } catch (error) {
      console.error('Error saving about text:', error);
      setError('Failed to save about text. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteAbout = async () => {
    setLoading(true);
    try {
      const aboutDoc = await getDocs(collection(db, 'about'));
      await deleteDoc(doc(db, 'about', aboutDoc.docs[0].id));
      setAboutText('');
      setIsEditMode(false);
      setError('');
    } catch (error) {
      console.error('Error deleting about text:', error);
      setError('Failed to delete about text. Please try again.');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
    }
    profilePictureInputRef.current.value = ''; // Reset the input value
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
  };

  const handleSaveTeamMember = async () => {
    setLoading(true);
    try {
      let updatedMemberData = { ...newMember };

      // Handle profile picture
      if (profilePicture) {
        const storageRef = ref(storage, `team/${profilePicture.name}`);
        await uploadBytes(storageRef, profilePicture);
        updatedMemberData.photoURL = await getDownloadURL(storageRef);

        // Delete old photo if it exists and is different from the new one
        if (editingMember && editingMember.photoURL && editingMember.photoURL !== updatedMemberData.photoURL) {
          const oldPhotoRef = ref(storage, editingMember.photoURL);
          await deleteObject(oldPhotoRef);
        }
      } else if (editingMember) {
        // If no new picture is uploaded, keep the existing photoURL
        updatedMemberData.photoURL = editingMember.photoURL;
      }

      if (editingMember) {
        // Update only the changed fields
        const changedFields = Object.keys(updatedMemberData).reduce((acc, key) => {
          if (updatedMemberData[key] !== editingMember[key]) {
            acc[key] = updatedMemberData[key];
          }
          return acc;
        }, {});

        if (Object.keys(changedFields).length > 0) {
          await updateDoc(doc(db, 'team', editingMember.id), changedFields);
        }
      } else {
        await addDoc(collection(db, 'team'), updatedMemberData);
      }

      setShowTeamModal(false);
      clearNewMember();
      fetchTeamMembers();
      setError('');
    } catch (error) {
      console.error('Error saving team member:', error);
      setError('Failed to save team member. Please try again.');
    }
    setLoading(false);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setNewMember(member);
    setProfilePicture(null); // Reset profile picture state
    setShowTeamModal(true);
  };

  const handleDeleteMember = async (memberId) => {
    setLoading(true);
    try {
      const memberToDelete = teamMembers.find(member => member.id === memberId);
      if (memberToDelete && memberToDelete.photoURL) {
        const photoRef = ref(storage, memberToDelete.photoURL);
        await deleteObject(photoRef);
      }
      await deleteDoc(doc(db, 'team', memberId));
      fetchTeamMembers();
      setError('');
    } catch (error) {
      console.error('Error deleting team member:', error);
      setError('Failed to delete team member. Please try again.');
    }
    setLoading(false);
  };

  const clearNewMember = () => {
    setNewMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      youtube: '',
      twitter: '',
      facebook: '',
      instagram: '',
    });
    setProfilePicture(null);
    setEditingMember(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Edit About Us</h1>

        <div className="mb-8">
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            className={`w-full p-4 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
            rows="6"
            placeholder="Enter about us text..."
          />
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveAbout}
            className={`px-4 py-2 rounded ${isEditMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            disabled={loading}
          >
            {loading ? <FaSpinner className="animate-spin" /> : isEditMode ? 'Edit' : 'Create'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAboutText('')}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} text-white`}
          >
            Clear
          </motion.button>
          {isEditMode && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteAbout}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
              disabled={loading}
            >
              Delete
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              clearNewMember();
              setShowTeamModal(true);
            }}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <FaUserPlus className="inline-block mr-2" /> Create Team Member
          </motion.button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className={`w-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} shadow-md rounded-lg`}>
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-200'}>
              <tr>
                <th className="px-4 py-2">Photo</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className={darkMode ? 'border-b border-gray-600' : 'border-b'}>
                  <td className="px-4 py-2">
                    <img src={member.photoURL || 'https://via.placeholder.com/40'} alt={`${member.firstName} ${member.lastName}`} className="w-10 h-10 rounded-full" />
                  </td>
                  <td className="px-4 py-2">{`${member.firstName} ${member.lastName}`}</td>
                  <td className="px-4 py-2">{member.email}</td>
                  <td className="px-4 py-2">{member.phone}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showTeamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-xl`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{editingMember ? 'Edit' : 'Create'} Team Member</h2>
                <button onClick={() => setShowTeamModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <input
                  type="text"
                  name="firstName"
                  value={newMember.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={newMember.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={newMember.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  value={newMember.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  required
                />
                <textarea
                  name="bio"
                  value={newMember.bio}
                  onChange={handleInputChange}
                  placeholder="Bio (optional)"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                  rows="3"
                />
                <input
                  type="text"
                  name="youtube"
                  value={newMember.youtube}
                  onChange={handleInputChange}
                  placeholder="YouTube Link (optional)"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
                <input
                  type="text"
                  name="twitter"
                  value={newMember.twitter}
                  onChange={handleInputChange}
                  placeholder="Twitter Link (optional)"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
                <input
                  type="text"
                  name="facebook"
                  value={newMember.facebook}
                  onChange={handleInputChange}
                  placeholder="Facebook Link (optional)"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
                <input
                  type="text"
                  name="instagram"
                  value={newMember.instagram}
                  onChange={handleInputChange}
                  placeholder="Instagram Link (optional)"
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="profilePicture"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    accept="image/*"
                    ref={profilePictureInputRef}
                  />
                  <label
                    htmlFor="profilePicture"
                    className={`cursor-pointer px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  >
                    <FaUpload className="inline-block mr-2" /> Upload Profile Picture
                  </label>
                  {profilePicture && (
                    <div className="flex items-center">
                      <span className="mr-2">{profilePicture.name}</span>
                      <button
                        onClick={removeProfilePicture}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {error && <p className="text-red-500 mt-4">{error}</p>}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowTeamModal(false)}
                  className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} text-white`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTeamMember}
                  className={`px-4 py-2 rounded ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditAbout;
