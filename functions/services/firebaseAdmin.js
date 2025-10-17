import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FB_PROJECT_ID,
      client_email: process.env.FB_CLIENT_EMAIL,
      private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FB_STORAGE_BUCKET
  });
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export default admin;
