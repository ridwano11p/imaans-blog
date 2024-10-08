import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaSpinner, FaCalendar, FaUser } from 'react-icons/fa';
import VideoPlayer from '../components/VideoPlayer';

const MediaContent = ({ imageUrl, videoUrl, isYouTubeVideo, title }) => {
  const containerClasses = "w-full aspect-square md:aspect-video bg-black flex items-center justify-center overflow-hidden";
  const mediaClasses = "w-full h-full object-contain";

  if (imageUrl && videoUrl) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={containerClasses}>
          <img src={imageUrl} alt={title} className={mediaClasses} />
        </div>
        <div className={containerClasses}>
          <VideoPlayer
            videoUrl={videoUrl}
            isYouTubeVideo={isYouTubeVideo}
          />
        </div>
      </div>
    );
  } else if (videoUrl) {
    return (
      <div className={containerClasses}>
        <VideoPlayer
          videoUrl={videoUrl}
          isYouTubeVideo={isYouTubeVideo}
        />
      </div>
    );
  } else if (imageUrl) {
    return (
      <div className={containerClasses}>
        <img src={imageUrl} alt={title} className={mediaClasses} />
      </div>
    );
  }
  return null;
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
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
        <FaSpinner className={`animate-spin text-6xl ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </div>
    );
  }

  if (error) {
    return <div className={`text-center mt-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#90d2dc]'}`}>
      {article && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <article className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-[#90d2dc] text-gray-800'}`}>
            <div className="mb-6">
              <MediaContent
                imageUrl={article.imageUrl}
                videoUrl={article.videoUrl}
                isYouTubeVideo={article.isYouTubeVideo}
                title={article.title}
              />
            </div>
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