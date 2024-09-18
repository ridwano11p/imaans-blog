import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const { currentUser } = useAuth();
  const { darkMode } = useContext(ThemeContext);

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
      }
    };

    fetchContactInfo();
  }, []);

  return (
    <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'} py-4`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            {contactInfo && (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <FaEnvelope className="mr-2" />
                  <a href={`mailto:${contactInfo.email}`} className="hover:underline">{contactInfo.email}</a>
                </div>
                <div className="flex items-center">
                  <FaPhone className="mr-2" />
                  <a href={`tel:${contactInfo.phone}`} className="hover:underline">{contactInfo.phone}</a>
                </div>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{contactInfo.location}</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-full md:w-auto">
            <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/about/who-we-are" className="hover:underline">Who We Are</Link></li>
              <li><Link to="/about/what-we-do" className="hover:underline">What We Do</Link></li>
              <li><Link to="/impact-stories" className="hover:underline">Impact Stories</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
        </div>
        {currentUser && (
          <div className="mt-4 text-center">
            <Link to="/edit/contact-info" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Edit Contact Information
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;