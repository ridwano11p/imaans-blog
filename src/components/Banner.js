import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

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
    <div className="w-full bg-gradient-to-r from-green-400 to-blue-500">
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl font-bold text-white mb-4">{bannerContent.title}</h1>
          <p className="text-xl text-white">{bannerContent.description}</p>
        </div>
        <div className="md:w-1/2">
          <img src={bannerContent.imageUrl} alt="Banner" className="rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  );
};

export default Banner;