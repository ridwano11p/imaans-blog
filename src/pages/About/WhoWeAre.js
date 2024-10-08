import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FaSpinner, FaLinkedin, FaFacebook, FaYoutube, FaTwitter } from 'react-icons/fa';

const SocialMediaButton = ({ icon, link, darkMode }) => {
  if (!link) return null;
  
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-10 h-10 rounded-full ${
        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
      } transition duration-300`}
    >
      {icon}
    </a>
  );
};

const TeamMemberModal = ({ member, darkMode, onClose }) => {
  const socialMediaLinks = [
    { icon: <FaLinkedin />, link: member.linkedin },
    { icon: <FaFacebook />, link: member.facebook },
    { icon: <FaYoutube />, link: member.youtube },
    { icon: <FaTwitter />, link: member.twitter },
  ].filter(item => item.link);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`relative max-w-2xl w-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-[#90d2dc]'} p-6`}>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-gray-500`}
        >
          &times;
        </button>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0">
            <img src={member.imageUrl} alt={member.name} className="w-40 h-40 rounded-full mx-auto object-cover" />
          </div>
          <div className="md:w-2/3 md:pl-6">
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</h2>
            <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.role}</p>
            <div className={`mb-4 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.bio}</div>
          </div>
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          {socialMediaLinks.length > 0 ? (
            socialMediaLinks.map((item, index) => (
              <SocialMediaButton key={index} icon={item.icon} link={item.link} darkMode={darkMode} />
            ))
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This team member has no social media links.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TeamMember = ({ member, darkMode, onOpenModal }) => {
  const truncatedBio = member.bio.length > 100 ? member.bio.substring(0, 100) + '...' : member.bio;

  return (
    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-[#90d2dc]'}`}>
      <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
      <h3 className={`text-xl font-semibold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</h3>
      <p className={`text-center mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{member.role}</p>
      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>{truncatedBio}</p>
      <button
        onClick={() => onOpenModal(member)}
        className={`w-full py-2 rounded ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition duration-300`}
      >
        More Info
      </button>
    </div>
  );
};

const WhoWeAre = () => {
  const { darkMode } = useContext(ThemeContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const searchTerm = searchParams.get('q');

        let q;
        if (searchTerm) {
          q = query(
            collection(db, 'team_members'),
            where('name', '>=', searchTerm.toLowerCase()),
            where('name', '<=', searchTerm.toLowerCase() + '\uf8ff')
          );
        } else {
          q = collection(db, 'team_members');
        }

        const querySnapshot = await getDocs(q);
        let members = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (searchTerm) {
          // Filter for partial matches
          const normalizedSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, ' ').trim();
          members = members.filter(member => 
            member.name.toLowerCase().replace(/\s+/g, ' ').trim().includes(normalizedSearchTerm)
          );
          if (members.length > 0) {
            setSelectedMember(members[0]);
          }
        }

        setTeamMembers(members);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching team members: ", err);
        setError("Failed to fetch team members. Please try again later.");
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [location]);

  const openModal = (member) => {
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
        {error}
      </div>
    );
  }

  const isSearchResult = new URLSearchParams(location.search).get('q') !== null;

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {isSearchResult ? 'Search Results' : 'Who We Are'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <TeamMember key={member.id} member={member} darkMode={darkMode} onOpenModal={openModal} />
          ))}
        </div>
        {isSearchResult && teamMembers.length === 0 && (
          <p className={`text-center mt-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No team members found matching your search.
          </p>
        )}
      </div>
      {selectedMember && (
        <TeamMemberModal member={selectedMember} darkMode={darkMode} onClose={closeModal} />
      )}
    </div>
  );
};

export default WhoWeAre;