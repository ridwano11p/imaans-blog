import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaSpinner, FaFilePdf, FaDownload, FaTimes } from 'react-icons/fa';

const PDFCard = ({ pdf, darkMode }) => {
  const [showPDF, setShowPDF] = useState(false);

  const handleViewPDF = () => {
    window.open(pdf.pdfUrl, '_blank');
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <FaFilePdf className={`text-4xl mr-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</h3>
        </div>
        <div 
          className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-line`}
          dangerouslySetInnerHTML={{ __html: pdf.description }}
        />
        <button
          onClick={handleViewPDF}
          className={`inline-flex items-center px-4 py-2 rounded ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition duration-300`}
        >
          <FaDownload className="mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

const PDFs = () => {
  const { darkMode } = useContext(ThemeContext);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pdfs'));
        const pdfList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          description: doc.data().description.replace(/\n/g, '<br>')
        }));
        setPdfs(pdfList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching PDFs: ", err);
        setError("Failed to fetch PDFs. Please try again later.");
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

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

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Research and Reports
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <PDFCard key={pdf.id} pdf={pdf} darkMode={darkMode} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFs;