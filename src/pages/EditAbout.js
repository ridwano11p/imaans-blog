import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const EditAbout = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: theme.background, color: theme.text }}>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Edit About Us</h1>
        <p>This is where the form to edit the About Us page content will be implemented.</p>
      </div>
    </div>
  );
};

export default EditAbout;
