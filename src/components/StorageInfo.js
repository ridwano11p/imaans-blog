import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { storage } from '../firebase';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { FaDatabase, FaCloudUploadAlt, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const StorageInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (showModal && user) {
      fetchStorageInfo();
    }
  }, [showModal, user]);

  const fetchStorageInfo = async () => {
    setLoading(true);
    try {
      const mediaFolders = ['images', 'pdfs', 'videos'];
      let totalFiles = 0;
      let totalSize = 0;

      for (const folder of mediaFolders) {
        const folderRef = ref(storage, folder);
        const fileList = await listAll(folderRef);
        totalFiles += fileList.items.length;

        for (const fileRef of fileList.items) {
          const metadata = await getMetadata(fileRef);
          totalSize += metadata.size;
        }
      }

      setStorageInfo({
        totalFiles,
        totalSize,
        mediaFolders
      });
    } catch (error) {
      console.error('Error fetching storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
  };

  const getSizeDisplay = (size) => {
    const mb = size / (1024 * 1024);
    const gb = mb / 1024;

    if (gb >= 1) {
      return { text: "You're out of storage. Please remove some files.", color: 'text-red-500' };
    } else if (mb >= 900) {
      return { text: formatBytes(size), color: 'text-red-500' };
    } else {
      return { text: formatBytes(size), color: darkMode ? 'text-gray-300' : 'text-gray-600' };
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`ml-4 px-4 py-2 rounded ${
          darkMode
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition duration-300 flex items-center`}
      >
        <FaDatabase className="mr-2" /> Storage Info
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`w-11/12 max-w-md p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Storage Information</h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <FaTimes className={darkMode ? 'text-white' : 'text-gray-800'} />
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center">
                <FaSpinner className="animate-spin text-4xl text-blue-500" />
              </div>
            ) : storageInfo ? (
              <div className={`space-y-4`}>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <FaCloudUploadAlt className="inline-block mr-2" />
                  Total Files: {storageInfo.totalFiles}
                </p>
                <p className={`flex items-center ${getSizeDisplay(storageInfo.totalSize).color}`}>
                  {getSizeDisplay(storageInfo.totalSize).text === "You're out of storage. Please remove some files." && (
                    <FaExclamationTriangle className="mr-2" />
                  )}
                  Total Storage Used: {getSizeDisplay(storageInfo.totalSize).text}
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Media Folders: {storageInfo.mediaFolders.join(', ')}
                </p>
              </div>
            ) : (
              <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No storage information available.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StorageInfo;
