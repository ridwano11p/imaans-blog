import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';

export const checkContentExists = async (collection, docId) => {
  try {
    const docRef = doc(db, collection, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking content existence:", error);
    return false;
  }
};

export const checkCollectionHasDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking collection for documents:", error);
    return false;
  }
};

export const checkBannerExists = async () => {
  try {
    const q = query(collection(db, 'banners'), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking banner existence:", error);
    return false;
  }
};

export const getContentExistence = async () => {
  const contentTypes = [
    { name: 'Who We Are', collection: 'about', docId: 'who_we_are' },
    { name: 'What We Do', collection: 'about', docId: 'what_we_do' },
    { name: 'Contact Info', collection: 'contact', docId: 'info' },
    { name: 'Feature Story', collection: 'featureStories', checkCollection: true },
    { name: 'Banner', checkBanner: true },
  ];

  const contentExistence = {};

  for (const contentType of contentTypes) {
    if (contentType.checkCollection) {
      contentExistence[contentType.name] = await checkCollectionHasDocuments(contentType.collection);
    } else if (contentType.checkBanner) {
      contentExistence[contentType.name] = await checkBannerExists();
    } else {
      contentExistence[contentType.name] = await checkContentExists(contentType.collection, contentType.docId);
    }
  }

  return contentExistence;
};