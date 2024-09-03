import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { theme, darkMode } = useContext(ThemeContext);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Failed to log in');
      console.error('Login error:', error);
    }
  };

  if (user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background, color: theme.text }}>
      <div className={`p-8 rounded-lg shadow-lg w-96 ${darkMode ? 'bg-blue-900' : 'bg-white'}`}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                  : 'bg-gray-100 text-gray-900 border-blue-500 focus:border-blue-300'
              }`}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-all duration-300 ${
                darkMode
                  ? 'bg-blue-800 text-white border-orange-500 focus:border-orange-300'
                  : 'bg-gray-100 text-gray-900 border-blue-500 focus:border-blue-300'
              }`}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-all duration-300 ${
              darkMode
                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            }`}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
