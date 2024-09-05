import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Failed to log in. Please check your email and password.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // or a loading spinner
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className={`max-w-md w-full space-y-8 ${darkMode ? 'bg-gray-700' : 'bg-white'} p-10 rounded-xl shadow-md`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} aria-hidden="true" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 pl-10 ${
                    darkMode
                      ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500 focus:ring-blue-500 focus:border-blue-500'
                      : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 pl-10 ${
                    darkMode
                      ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500 focus:ring-blue-500 focus:border-blue-500'
                      : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } focus:outline-none transition duration-150 ease-in-out`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <FaSpinner className="h-5 w-5 text-white animate-spin" aria-hidden="true" />
                ) : (
                  <FaSignInAlt className="h-5 w-5 text-white" aria-hidden="true" />
                )}
              </span>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
