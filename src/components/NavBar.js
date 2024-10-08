import React, { useContext, useReducer, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaSun, FaMoon, FaChevronDown, FaChevronUp, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/sitelogo.png';

const initialState = {
  openMenu: null,
  isMobileMenuOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_MENU':
      return { ...state, openMenu: state.openMenu === action.payload ? null : action.payload };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_ALL':
      return { ...state, openMenu: null, isMobileMenuOpen: false };
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'CLOSE_ALL' });
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.submenu-container')) {
        dispatch({ type: 'CLOSE_ALL' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleMenu = (menu) => {
    dispatch({ type: 'TOGGLE_MENU', payload: menu });
  };

  const closeMenu = () => {
    dispatch({ type: 'CLOSE_ALL' });
  };

  const aboutUsItems = [
    { name: 'Who We Are', link: '/about/who-we-are' },
    { name: 'What We Do', link: '/about/what-we-do' },
  ];

  const docsItems = [
    { name: 'Documentary', link: '/documentaries/documentary' },
  ];

  const researchItems = [
    { name: 'Bookshelf', link: '/research/bookshelf' },
  ];

  const galleryItems = [
    { name: 'Photos', link: '/gallery/photos' },
  ];

  const navbarClasses = darkMode ? 'bg-gray-900' : 'bg-teal-700';

  return (
    <nav className={`${navbarClasses} w-full`}>
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-gray-200">Home</Link>
              <Link to="/search-page" className="text-white hover:text-gray-200">Search</Link>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <Link to="/create" className="text-white hover:text-gray-200">Create</Link>
                  <Link to="/edit" className="text-white hover:text-gray-200">Edit</Link>
                </>
              )}
              {user ? (
                <button onClick={handleLogout} className="text-white hover:text-gray-200">Logout</button>
              ) : (
                <Link to="/login" className="text-white hover:text-gray-200">Login</Link>
              )}
              <button onClick={toggleDarkMode} className="text-white p-2">
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
            </div>
          </div>
          
          {/* Middle Row */}
          <div className="flex justify-center py-4">
            <Link to="/" className="flex items-center group">
              <div className="w-16 h-16 mr-2 flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Site Logo" className="w-full h-full object-contain group-hover:opacity-80 transition-opacity duration-200" />
              </div>
              <span className="text-white text-2xl font-bold group-hover:text-gray-200 transition-colors duration-200 whitespace-nowrap">Travel To End FGM</span>
            </Link>
          </div>
          
          {/* Bottom Row */}
          <div className="flex items-center justify-center space-x-6 py-2">
            <div className="submenu-container">
              <SubMenu
                title="About Us"
                items={aboutUsItems}
                isOpen={state.openMenu === 'aboutUs'}
                toggleMenu={() => toggleMenu('aboutUs')}
                closeMenu={closeMenu}
                isMobile={false}
              />
            </div>
            <Link to="/impact-stories" className="text-white hover:text-gray-200">Impact Stories</Link>
            <div className="submenu-container">
              <SubMenu
                title="Documentary"
                items={docsItems}
                isOpen={state.openMenu === 'docs'}
                toggleMenu={() => toggleMenu('docs')}
                closeMenu={closeMenu}
                isMobile={false}
              />
            </div>
            <div className="submenu-container">
              <SubMenu
                title="Research and Reports"
                items={researchItems}
                isOpen={state.openMenu === 'research'}
                toggleMenu={() => toggleMenu('research')}
                closeMenu={closeMenu}
                isMobile={false}
              />
            </div>
            <div className="submenu-container">
              <SubMenu
                title="Gallery"
                items={galleryItems}
                isOpen={state.openMenu === 'gallery'}
                toggleMenu={() => toggleMenu('gallery')}
                closeMenu={closeMenu}
                isMobile={false}
              />
            </div>
            <Link to="/contact" className="text-white hover:text-gray-200">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center group">
            <div className="w-12 h-12 mr-2 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Site Logo" className="w-full h-full object-contain group-hover:opacity-80 transition-opacity duration-200" />
            </div>
            <span className="text-white text-xl font-bold group-hover:text-gray-200 transition-colors duration-200 whitespace-nowrap">Travel To End FGM</span>
          </Link>
          <button onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })} className="text-white p-2">
            {state.isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {state.isMobileMenuOpen && (
          <div className="w-full">
            <div className="flex flex-col space-y-2 p-4">
              <Link to="/" className="text-white hover:text-gray-200" onClick={closeMenu}>Home</Link>
              <Link to="/search-page" className="text-white hover:text-gray-200" onClick={closeMenu}>Search</Link>
              <SubMenu
                title="About Us"
                items={aboutUsItems}
                isOpen={state.openMenu === 'aboutUs'}
                toggleMenu={() => toggleMenu('aboutUs')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <Link to="/impact-stories" className="text-white hover:text-gray-200" onClick={closeMenu}>Impact Stories</Link>
              <SubMenu
                title="Documentary"
                items={docsItems}
                isOpen={state.openMenu === 'docs'}
                toggleMenu={() => toggleMenu('docs')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <SubMenu
                title="Research and Reports"
                items={researchItems}
                isOpen={state.openMenu === 'research'}
                toggleMenu={() => toggleMenu('research')}
                closeMenu={closeMenu}
                isMobile={true}
              />
              <SubMenu
                title="Gallery"
                items={galleryItems}
                isOpen={state.openMenu === 'gallery'}
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
      </div>
    </nav>
  );
};

export default NavBar;
