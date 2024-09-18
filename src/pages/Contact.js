import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  const { darkMode } = useContext(ThemeContext);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const q = query(collection(db, 'siteContactInfo'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setContactInfo(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const ContactItem = ({ icon, label, value }) => (
    <div className="flex items-center mb-4">
      <div className={`mr-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
        {icon}
      </div>
      <div>
        <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
        <p className={darkMode ? 'text-white' : 'text-gray-800'}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-2xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Contact Us
        </h1>
        
        {loading ? (
          <p className={`text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Loading contact information...</p>
        ) : contactInfo ? (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <ContactItem 
              icon={<FaEnvelope size={24} />} 
              label="Email" 
              value={contactInfo.email} 
            />
            <ContactItem 
              icon={<FaPhone size={24} />} 
              label="Phone" 
              value={contactInfo.phone} 
            />
            <ContactItem 
              icon={<FaMapMarkerAlt size={24} />} 
              label="Location" 
              value={contactInfo.location} 
            />
          </div>
        ) : (
          <p className={`text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>No contact information available.</p>
        )}
      </div>
    </div>
  );
};

export default Contact;