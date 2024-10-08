import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';

const CreateContactInfo = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    checkExistingContactInfo();
  }, [user, navigate]);

  const checkExistingContactInfo = async () => {
    const querySnapshot = await getDocs(collection(db, 'siteContactInfo'));
    if (!querySnapshot.empty) {
      alert('Contact information already exists. Please use the edit page to update it.');
      navigate('/edit');
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!location.trim()) {
      setError('Location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'siteContactInfo'), {
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        createdAt: new Date(),
      });
      alert('Contact information created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding contact info: ', error);
      setError('An error occurred while creating contact information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#90d2dc] text-gray-800'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">Create Contact Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 font-medium">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full p-3 border rounded-md ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block mb-2 font-medium">Phone:</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={`w-full p-3 border rounded-md ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <div>
            <label htmlFor="location" className="block mb-2 font-medium">Location:</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className={`w-full p-3 border rounded-md ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <FaSpinner className="animate-spin mx-auto" />
            ) : (
              'Create Contact Information'
            )}
          </button>
        </form>
        {error && (
          <div className={`mt-4 p-4 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateContactInfo;