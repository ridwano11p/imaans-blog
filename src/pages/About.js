// src/pages/About.js

import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaTwitter, FaFacebook, FaInstagram, FaTimes, FaEnvelope, FaPhone } from 'react-icons/fa';

const About = () => {
  const { darkMode } = useContext(ThemeContext);
  const [aboutText, setAboutText] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchAboutText();
    fetchTeamMembers();
  }, []);

  const fetchAboutText = async () => {
    try {
      const aboutDoc = await getDocs(collection(db, 'about'));
      if (!aboutDoc.empty) {
        setAboutText(aboutDoc.docs[0].data().text);
      }
    } catch (error) {
      console.error('Error fetching about text:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const teamSnapshot = await getDocs(collection(db, 'team'));
      const members = teamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const TeamMemberCard = ({ member }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} flex flex-col items-center`}
    >
      <img
        src={member.photoURL || 'https://via.placeholder.com/150'}
        alt={`${member.firstName} ${member.lastName}`}
        className="w-32 h-32 rounded-full mb-4 object-cover"
      />
      <h3 className={`text-xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {member.firstName} {member.lastName}
      </h3>
      <p className={`mb-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.bio.substring(0, 100)}...</p>
      <button
        onClick={() => setSelectedMember(member)}
        className={`px-4 py-2 rounded-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition duration-300`}
      >
        More Info
      </button>
    </motion.div>
  );

  const MemberModal = ({ member, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md p-6 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl flex flex-col items-center max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`self-end text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <FaTimes />
        </button>
        <img
          src={member.photoURL || 'https://via.placeholder.com/150'}
          alt={`${member.firstName} ${member.lastName}`}
          className="w-40 h-40 rounded-full object-cover mb-4"
        />
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {member.firstName} {member.lastName}
          </h2>
          <div className={`mb-4 flex items-center justify-center space-x-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center">
              <FaEnvelope className="mr-2" />
              <span>{member.email}</span>
            </div>
            <div className="flex items-center">
              <FaPhone className="mr-2" />
              <span>{member.phone}</span>
            </div>
          </div>
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {member.bio}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {member.youtube && (
            <a
              href={member.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-4 py-2 rounded-full ${
                darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
              } text-white transition duration-300`}
            >
              <FaYoutube className="mr-2" /> YouTube
            </a>
          )}
          {member.twitter && (
            <a
              href={member.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-4 py-2 rounded-full ${
                darkMode ? 'bg-blue-400 hover:bg-blue-500' : 'bg-blue-300 hover:bg-blue-400'
              } text-white transition duration-300`}
            >
              <FaTwitter className="mr-2" /> Twitter
            </a>
          )}
          {member.facebook && (
            <a
              href={member.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-4 py-2 rounded-full ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition duration-300`}
            >
              <FaFacebook className="mr-2" /> Facebook
            </a>
          )}
          {member.instagram && (
            <a
              href={member.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center px-4 py-2 rounded-full ${
                darkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
              } text-white transition duration-300`}
            >
              <FaInstagram className="mr-2" /> Instagram
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          About Us
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`mb-12 p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-3xl mx-auto`}
        >
          <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Our Story</h2>
          <div className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} prose max-w-none`}>
            {aboutText ? (
              <div dangerouslySetInnerHTML={{ __html: aboutText }} />
            ) : (
              <p className="text-center">No information added yet.</p>
            )}
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`text-3xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          Our Team
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
        >
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </motion.div>

        <AnimatePresence>
          {selectedMember && (
            <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default About;
