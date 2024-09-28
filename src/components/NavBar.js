import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaSun, FaMoon, FaChevronDown, FaChevronUp, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/sitelogo.png';

const SubMenu = ({ title, items, isOpen, toggleMenu, closeMenu, isMobile }) => {
  return (
    <div className={`${isMobile ? 'w-full' : 'relative group'}`}>
      <button
        onClick={toggleMenu}
        className="flex items-center text-white hover:text-gray-200 whitespace-nowrap"
      >
        {title}
        <span className="ml-1">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${isMobile ? 'w-full' : 'absolute left-0 mt-2'} py-2 bg-white rounded-md shadow-xl z-20 min-w-max`}
          >
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
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

  const navbarClasses = darkMode ? 'bg-gray-900' : 'bg-emerald-500';

  return (
    <nav className={`${navbarClasses} p-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center group mr-6">
            <div className="w-16 h-16 mr-2 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Site Logo" className="w-full h-full object-contain group-hover:opacity-80 transition-opacity duration-200" />
            </div>
            <span className="text-white text-2xl font-bold group-hover:text-gray-200 transition-colors duration-200 whitespace-nowrap">Travel To End FGM</span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-gray-200 whitespace-nowrap">Home</Link>
            <Link to="/search-page" className="text-white hover:text-gray-200 whitespace-nowrap">Search</Link>
            <SubMenu
              title="About Us"
              items={aboutUsItems}
              isOpen={openMenu === 'aboutUs'}
              toggleMenu={() => toggleMenu('aboutUs')}
              closeMenu={closeMenu}
              isMobile={false}
            />
            <Link to="/impact-stories" className="text-white hover:text-gray-200 whitespace-nowrap">Impact Stories</Link>
            <SubMenu
              title="Documentaries"
              items={docsItems}
              isOpen={openMenu === 'docs'}
              toggleMenu={() => toggleMenu('docs')}
              closeMenu={closeMenu}
              isMobile={false}
            />
            <SubMenu
              title="Research and Reports"
              items={researchItems}
              isOpen={openMenu === 'research'}
              toggleMenu={() => toggleMenu('research')}
              closeMenu={closeMenu}
              isMobile={false}
            />
            <SubMenu
              title="Gallery"
              items={galleryItems}
              isOpen={openMenu === 'gallery'}
              toggleMenu={() => toggleMenu('gallery')}
              closeMenu={closeMenu}
              isMobile={false}
            />
            <Link to="/contact" className="text-white hover:text-gray-200 whitespace-nowrap">Contact Us</Link>
            {user && (
              <>
                <Link to="/create" className="text-white hover:text-gray-200 whitespace-nowrap">Create</Link>
                <Link to="/edit" className="text-white hover:text-gray-200 whitespace-nowrap">Edit</Link>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="hidden lg:flex items-center space-x-4">
            <button onClick={toggleDarkMode} className="text-white p-2">
              {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-200 whitespace-nowrap"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-white hover:text-gray-200 whitespace-nowrap">Login</Link>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-white p-2">
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4">
          <div className="flex flex-col space-y-2">
            <Link to="/" className="text-white hover:text-gray-200" onClick={closeMenu}>Home</Link>
            <Link to="/search-page" className="text-white hover:text-gray-200" onClick={closeMenu}>Search</Link>
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
            <div className="flex items-center justify-between mt-4">
              <button onClick={toggleDarkMode} className="text-white p-2">
                {darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
              </button>
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
