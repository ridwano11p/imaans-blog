import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export const getContentExistence = async () => {
  const contentTypes = [
    { name: 'Who We Are', collection: 'about', docId: 'who_we_are' },
    { name: 'What We Do', collection: 'about', docId: 'what_we_do' },
    { name: 'Contact Info', collection: 'contact', docId: 'info' },
  ];

  const contentExistence = {};

  for (const contentType of contentTypes) {
    contentExistence[contentType.name] = await checkContentExists(contentType.collection, contentType.docId);
  }

  return contentExistence;
};