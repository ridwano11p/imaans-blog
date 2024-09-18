import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FaSpinner, FaEdit, FaTrash, FaFilePdf } from 'react-icons/fa';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

const EditPDF = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [editingPdf, setEditingPdf] = useState(null);
  const [newPdfFile, setNewPdfFile] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchPdfs();
    }
  }, [user, navigate]);

  const fetchPdfs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'pdfs'));
      const querySnapshot = await getDocs(q);
      const fetchedPdfs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPdfs(fetchedPdfs);
    } catch (err) {
      console.error("Error fetching PDFs: ", err);
      setError("Failed to fetch PDFs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pdf) => {
    setEditingPdf(pdf);
    setNewPdfFile(null);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_PDF_SIZE) {
        setError(`PDF file size should be less than ${MAX_PDF_SIZE / (1024 * 1024)}MB`);
        return;
      }
      if (file.type !== 'application/pdf') {
        setError("Please upload a valid PDF file.");
        return;
      }
      setNewPdfFile(file);
    }
  };

  const validateForm = () => {
    if (editingPdf.title.trim().length < 3) {
      setError("Title must be at least 3 characters long.");
      return false;
    }
    if (editingPdf.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return false;
    }
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    try {
      const pdfRef = doc(db, 'pdfs', editingPdf.id);
      let updateData = {
        title: editingPdf.title.trim(),
        description: editingPdf.description.trim(),
        updatedAt: new Date()
      };

      if (newPdfFile) {
        // Delete old PDF if it exists
        if (editingPdf.pdfUrl) {
          const oldPdfRef = ref(storage, editingPdf.pdfUrl);
          await deleteObject(oldPdfRef);
        }

        const fileName = `${Date.now()}_${newPdfFile.name}`;
        const pdfFileRef = ref(storage, `pdfs/${fileName}`);
        await uploadBytes(pdfFileRef, newPdfFile);
        const pdfUrl = await getDownloadURL(pdfFileRef);
        updateData.pdfUrl = pdfUrl;
        updateData.fileName = fileName;
      }

      await updateDoc(pdfRef, updateData);
      setEditingPdf(null);
      fetchPdfs();
    } catch (err) {
      console.error("Error updating PDF: ", err);
      setError("Failed to update PDF. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (pdfId) => {
    if (window.confirm("Are you sure you want to delete this PDF?")) {
      setUpdating(true);
      try {
        const pdfToDelete = pdfs.find(p => p.id === pdfId);
        if (pdfToDelete.pdfUrl) {
          const pdfRef = ref(storage, pdfToDelete.pdfUrl);
          await deleteObject(pdfRef);
        }
        await deleteDoc(doc(db, 'pdfs', pdfId));

        // Check if this was the last item in the collection
        const pdfsSnapshot = await getDocs(collection(db, 'pdfs'));
        if (pdfsSnapshot.empty) {
          // If the collection is now empty, delete the entire 'pdfs' folder in Storage
          const pdfsRef = ref(storage, 'pdfs');
          const pdfsList = await listAll(pdfsRef);
          await Promise.all(pdfsList.items.map(item => deleteObject(item)));
        }

        fetchPdfs();
      } catch (err) {
        console.error("Error deleting PDF: ", err);
        setError("Failed to delete PDF. Please try again.");
      } finally {
        setUpdating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className={`text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Edit PDFs
        </h1>
        {error && (
          <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
        {editingPdf ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="title" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                id="title"
                value={editingPdf.title}
                onChange={(e) => setEditingPdf({...editingPdf, title: e.target.value})}
                required
                minLength={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="description" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Description</label>
              <textarea
                id="description"
                value={editingPdf.description}
                onChange={(e) => setEditingPdf({...editingPdf, description: e.target.value})}
                required
                minLength={10}
                rows="5"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              ></textarea>
            </div>
            <div>
              <label htmlFor="pdf" className={`block mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>New PDF File (Optional)</label>
              <input
                type="file"
                id="pdf"
                onChange={handlePdfChange}
                accept=".pdf"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditingPdf(null)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                } text-gray-800 transition duration-300`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition duration-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? <FaSpinner className="animate-spin mx-auto" /> : 'Update PDF'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center mb-4">
                  <FaFilePdf className={`text-4xl mr-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</h2>
                </div>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{pdf.description}</p>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>File: {pdf.fileName}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleEdit(pdf)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className={`px-4 py-2 rounded-md ${
                      darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                    } text-white transition duration-300 flex items-center`}
                  >
                    <FaTrash className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPDF;