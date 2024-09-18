import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Banner from '../components/Banner';

const Home = () => {
  const { darkMode } = useContext(ThemeContext);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        const blogs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLatestBlogs(blogs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching latest blogs: ", err);
        setError("Failed to fetch latest blogs. Please try again later.");
        setLoading(false);
      }
    };

    fetchLatestBlogs();
  }, []);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Banner />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-16">
          <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Our Mission</h2>
          <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Travel To End FGM is dedicated to raising awareness and promoting action to end Female Genital Mutilation (FGM) globally. Through education, advocacy, and community engagement, we strive to protect the rights and well-being of girls and women worldwide.
          </p>
          <Link to="/about/what-we-do" className={`inline-block px-6 py-3 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}>
            Learn More About Our Work
          </Link>
        </div>

        <div className="mb-16">
          <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Latest Impact Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestBlogs.map((blog) => (
              <div key={blog.id} className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {blog.imageUrl && (
                  <img src={blog.imageUrl} alt={blog.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{blog.title}</h3>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{blog.date}</p>
                  <Link to={`/impact-stories#${blog.id}`} className={`inline-block px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition duration-300`}>
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/impact-stories" className={`inline-block px-6 py-3 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition duration-300`}>
              View All Impact Stories
            </Link>
          </div>
        </div>

        <div className="mb-16">
          <h2 className={`text-3xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Get Involved</h2>
          <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Join us in our mission to end FGM. Whether you're looking to volunteer, donate, or spread awareness, your support can make a significant impact in the lives of girls and women around the world.
          </p>
          <Link to="/contact" className={`inline-block px-6 py-3 rounded-md ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition duration-300`}>
            Contact Us to Get Involved
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
