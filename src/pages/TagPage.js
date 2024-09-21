import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FaSpinner, FaPlayCircle } from 'react-icons/fa';

const MediaPreview = ({ post, darkMode }) => {
  const hasImage = post.imageUrl && post.imageUrl.trim() !== '';
  const hasVideo = post.videoUrl && post.videoUrl.trim() !== '';

  const renderMedia = (url, isVideo, isYouTube = false) => (
    <div className="relative w-full h-0 pb-[56.25%] bg-black overflow-hidden">
      {isVideo ? (
        <>
          {isYouTube ? (
            <img
              src={`https://img.youtube.com/vi/${url.split('v=')[1]}/0.jpg`}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              src={url}
              className="absolute inset-0 w-full h-full object-cover"
              preload="metadata"
            />
          )}
          <FaPlayCircle className="absolute inset-0 m-auto text-white text-5xl opacity-80" />
        </>
      ) : (
        <img
          src={url}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
    </div>
  );

  if (hasImage && hasVideo) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {renderMedia(post.imageUrl, false)}
        {renderMedia(post.videoUrl, true, post.isYouTubeVideo)}
      </div>
    );
  } else if (hasImage) {
    return renderMedia(post.imageUrl, false);
  } else if (hasVideo) {
    return renderMedia(post.videoUrl, true, post.isYouTubeVideo);
  }

  return null;
};

const TagPage = () => {
  const { tag } = useParams();
  const { darkMode } = useContext(ThemeContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostsByTag = async () => {
      try {
        const blogQuery = query(
          collection(db, 'blogs'),
          where('tags', 'array-contains', tag)
        );
        const featureStoryQuery = query(
          collection(db, 'featureStories'),
          where('tags', 'array-contains', tag)
        );

        const [blogSnapshot, featureStorySnapshot] = await Promise.all([
          getDocs(blogQuery),
          getDocs(featureStoryQuery)
        ]);

        const blogData = blogSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'blog',
          ...doc.data()
        }));

        const featureStoryData = featureStorySnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'featureStory',
          ...doc.data()
        }));

        const allPosts = [...blogData, ...featureStoryData];
        allPosts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setPosts(allPosts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching posts by tag: ", err);
        setError("Failed to fetch posts. Please try again later.");
        setLoading(false);
      }
    };

    fetchPostsByTag();
  }, [tag]);

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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className={`text-4xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Posts tagged with "{tag}"
        </h1>
        {posts.length === 0 ? (
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No posts found with this tag.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/article/${post.id}`}
                className={`block rounded-lg shadow-md overflow-hidden transition duration-300 ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <MediaPreview post={post} darkMode={darkMode} />
                <div className="p-6">
                  <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {post.title}
                  </h2>
                  <p className={`mb-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {post.type === 'featureStory' ? 'Featured Story' : 'Blog Post'}
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {post.content.substring(0, 150)}...
                  </p>
                  <div className="flex flex-wrap">
                    {post.tags.map(postTag => (
                      <span
                        key={postTag}
                        className={`inline-block px-2 py-1 rounded-full text-sm font-semibold mr-2 mb-2 ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {postTag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPage;