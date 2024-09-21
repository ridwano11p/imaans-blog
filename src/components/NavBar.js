import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaSun, FaMoon, FaChevronDown, FaChevronUp, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/sitelogo.png';

const SubMenu = ({ title, items, isOpen, toggleMenu, closeMenu, isMobile }) => {
  return (
    <div className={`${isMobile ? 'w-full' : 'relative'}`}>
      <button
        onClick={toggleMenu}
        className="flex items-center text-white hover:text-gray-200 w-full justify-between"
      >
        {title}
        {isOpen ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${isMobile ? 'w-full' : 'absolute left-0'} mt-2 py-2 bg-white rounded-md shadow-xl z-20`}
          >
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavBar = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  };

  const aboutUsItems = [
    { name: 'Who We Are', link: '/about/who-we-are' },
    { name: 'What We Do', link: '/about/what-we-do' },
  ];

  const docsItems = [
    { name: 'Videos', link: '/documentaries/videos' },
  ];

  const researchItems = [
    { name: 'PDFs', link: '/research/pdfs' },
  ];

  const galleryItems = [
    { name: 'Photos', link: '/gallery/photos' },
  ];

  const navbarClasses = darkMode
    ? 'bg-gray-900'
    : 'bg-emerald-500';

  return (
    <nav className={`${navbarClasses} p-4`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Site Logo" className="h-8 w-8 mr-2" />
          <Link to="/" className="text-white text-2xl font-bold">Travel To End FGM</Link>
        </div>
        <div className="hidden md:flex space-x-4">
          <Link to="/" className="text-white hover:text-gray-200">Home</Link>
          <SubMenu
            title="About Us"
            items={aboutUsItems}
            isOpen={openMenu === 'aboutUs'}
            toggleMenu={() => toggleMenu('aboutUs')}
            closeMenu={closeMenu}
          />
          <Link to="/impact-stories" className="text-white hover:text-gray-200">Impact Stories</Link>
          <SubMenu
            title="Documentaries"
            items={docsItems}
            isOpen={openMenu === 'docs'}
            toggleMenu={() => toggleMenu('docs')}
            closeMenu={closeMenu}
          />
          <SubMenu
            title="Research and Reports"
            items={researchItems}
            isOpen={openMenu === 'research'}
            toggleMenu={() => toggleMenu('research')}
            closeMenu={closeMenu}
          />
          <SubMenu
            title="Gallery"
            items={galleryItems}
            isOpen={openMenu === 'gallery'}
            toggleMenu={() => toggleMenu('gallery')}
            closeMenu={closeMenu}
          />
          <Link to="/contact" className="text-white hover:text-gray-200">Contact Us</Link>
          {user && (
            <>
              <Link to="/create" className="text-white hover:text-gray-200">Create</Link>
              <Link to="/edit" className="text-white hover:text-gray-200">Edit</Link>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <button onClick={toggleDarkMode} className="text-white">
            {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-200"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="text-white hover:text-gray-200">Login</Link>
          )}
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4"
          >
            <div className="flex justify-end mb-4">
              <button onClick={toggleDarkMode} className="text-white mr-4">
                {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
              </button>
              <button onClick={closeMenu} className="text-white">
                <FaTimes size={24} />
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-white hover:text-gray-200" onClick={closeMenu}>Home</Link>
              <SubMenu
                title="About Us"
                items={aboutUsItems}
                isOpen={openMenu === 'aboutUs'}
                toggleMenu={() => toggleMenu('aboutUs')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <Link to="/impact-stories" className="text-white hover:text-gray-200" onClick={closeMenu}>Impact Stories</Link>
              <SubMenu
                title="Documentaries"
                items={docsItems}
                isOpen={openMenu === 'docs'}
                toggleMenu={() => toggleMenu('docs')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <SubMenu
                title="Research and Reports"
                items={researchItems}
                isOpen={openMenu === 'research'}
                toggleMenu={() => toggleMenu('research')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <SubMenu
                title="Gallery"
                items={galleryItems}
                isOpen={openMenu === 'gallery'}
                toggleMenu={() => toggleMenu('gallery')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <Link to="/contact" className="text-white hover:text-gray-200" onClick={closeMenu}>Contact Us</Link>
              {user && (
                <>
                  <Link to="/create" className="text-white hover:text-gray-200" onClick={closeMenu}>Create</Link>
                  <Link to="/edit" className="text-white hover:text-gray-200" onClick={closeMenu}>Edit</Link>
                </>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="text-white hover:text-gray-200"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="text-white hover:text-gray-200" onClick={closeMenu}>Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;
