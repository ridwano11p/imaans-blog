import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const About = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold mb-4">About Us</h1>
            <p className="text-xl">This is the about page of Imaan's Blog.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
