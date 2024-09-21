import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaSpinner, FaCalendar, FaUser } from 'react-icons/fa';

const VideoPlayer = ({ videoUrl, isYoutubeVideo }) => {
  if (isYoutubeVideo) {
    return (
      <div className="w-full h-0 pb-[56.25%] relative rounded-lg overflow-hidden">
        <iframe
          src={videoUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="encrypted-media"
          allowFullScreen
          title="Embedded Video"
        />
      </div>
    );
  } else {
    return (
      <video
        src={videoUrl}
        className="w-full h-auto rounded-lg"
        controls
        preload="metadata"
      />
    );
  }
};

const ImageDisplay = ({ imageUrl, title }) => {
  return (
    <div className="w-full h-0 pb-[56.25%] relative rounded-lg overflow-hidden bg-black">
      <img
        src={imageUrl}
        alt={title}
        className="absolute top-0 left-0 w-full h-full object-contain"
      />
    </div>
  );
};

const formatContent = (content) => {
  return content.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-6 last:mb-0">
      {paragraph}
    </p>
  ));
};

const ArticlePage = () => {
  const { id } = useParams();
  const { darkMode } = useContext(ThemeContext);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Try to fetch from 'blogs' collection
        let docRef = doc(db, 'blogs', id);
        let docSnap = await getDoc(docRef);

        // If not found in 'blogs', try 'featureStories'
        if (!docSnap.exists()) {
          docRef = doc(db, 'featureStories', id);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Article not found");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching article: ", err);
        setError("Failed to fetch article. Please try again later.");
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {article && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <article className={`bg-white rounded-lg shadow-lg overflow-hidden ${darkMode ? 'dark:bg-gray-800 text-gray-100' : 'text-gray-800'}`}>
            {(article.imageUrl || article.videoUrl) && (
              <div className={`mb-6 ${article.imageUrl && article.videoUrl ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                {article.imageUrl && (
                  <ImageDisplay imageUrl={article.imageUrl} title={article.title} />
                )}
                {article.videoUrl && (
                  <VideoPlayer videoUrl={article.videoUrl} isYoutubeVideo={article.isYouTubeVideo} />
                )}
              </div>
            )}
            <div className="p-6 md:p-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
              <div className="flex flex-wrap items-center text-sm mb-6">
                {article.author && (
                  <div className="flex items-center mr-6 mb-2">
                    <FaUser className="mr-2" />
                    <span>{article.author}</span>
                  </div>
                )}
                {article.date && (
                  <div className="flex items-center mb-2">
                    <FaCalendar className="mr-2" />
                    <span>{article.date}</span>
                  </div>
                )}
              </div>
              <div className="mb-6">
                {article.tags && article.tags.map(tag => (
                  <span 
                    key={tag} 
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mr-2 mb-2 ${
                      darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none`}>
                {formatContent(article.content)}
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default ArticlePage;