import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const MediaContent = ({ mediaUrl, mediaType, isYouTubeVideo, title }) => {
  if (mediaType === 'video') {
    if (isYouTubeVideo) {
      const videoId = mediaUrl.split('v=')[1];
      return (
        <div className="w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        </div>
      );
    } else {
      return (
        <div className="w-full aspect-video">
          <video
            src={mediaUrl}
            className="w-full h-full object-cover rounded-lg"
            controls
            playsInline
          />
        </div>
      );
    }
  } else {
    return (
      <img
        src={mediaUrl}
        alt={title}
        className="w-full h-full object-cover rounded-lg"
      />
    );
  }
};

const formatContent = (content) => {
  return content.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-2 last:mb-0">
      {paragraph}
    </p>
  ));
};

const Banner = () => {
  const [bannerContent, setBannerContent] = useState(null);

  useEffect(() => {
    const fetchBannerContent = async () => {
      try {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setBannerContent(querySnapshot.docs[0].data());
        }
      } catch (err) {
        console.error("Error fetching banner content: ", err);
      }
    };

    fetchBannerContent();
  }, []);

  if (!bannerContent) return null;

  return (
    <div className="w-full bg-emerald-500">
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
          <h1 className="text-4xl font-bold text-white mb-4">{bannerContent.title}</h1>
          <div className="text-xl text-white">
            {formatContent(bannerContent.description)}
          </div>
        </div>
        <div className="md:w-5/12 w-full">
          <MediaContent
            mediaUrl={bannerContent.mediaUrl}
            mediaType={bannerContent.mediaType}
            isYouTubeVideo={bannerContent.isYouTubeVideo}
            title={bannerContent.title}
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;