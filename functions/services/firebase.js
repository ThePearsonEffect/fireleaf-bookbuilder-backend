import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Wrap everything in async IIFE to handle top-level await
(async function initializeFirebase() {
  try {
    // Firebase configuration - prioritize environment variables
    const firebaseConfig = {
      apiKey: window.FIREBASE_API_KEY || "AIzaSyAPMz9yGzOhXZAz3g8zBT2BVpqUnwoAg-E",
      authDomain: window.FIREBASE_AUTH_DOMAIN || "tribelifeinspired-3d888.firebaseapp.com",
      projectId: window.FIREBASE_PROJECT_ID || "tribelifeinspired-3d888",
      storageBucket: window.FIREBASE_STORAGE_BUCKET || "tribelifeinspired-3d888.firebasestorage.app",
      messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "617062636859",
      appId: window.FIREBASE_APP_ID || "1:617062636859:web:2571d60d27bc34987d6b1e",
      measurementId: window.FIREBASE_MEASUREMENT_ID || "G-3QB8FQDE7R"
    };

    // Validate config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is incomplete');
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Initialize Analytics safely
    isSupported().then(supported => {
      if (supported) {
        getAnalytics(app);
        console.log('Analytics initialized');
      }
    }).catch(err => {
      console.warn('Analytics initialization failed:', err);
    });

    // Authenticate anonymously with timeout
    const authPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      signInAnonymously(auth)
        .then(() => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              clearTimeout(timeout);
              unsubscribe();
              console.log('Authenticated anonymously:', user.uid);
              resolve(user);
            }
          });
        })
        .catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
    });

    await authPromise;

    // Upload helper function
    async function uploadFile(file, pathPrefix = "uploads") {
      if (!file) {
        throw new Error('No file provided');
      }

      // Check auth state
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${pathPrefix}/${Date.now()}_${sanitizedFileName}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      // Upload with progress tracking
      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log(`Upload progress: ${progress}%`);
            
            // Dispatch custom event for progress tracking
            window.dispatchEvent(new CustomEvent('uploadProgress', { 
              detail: { progress, file: file.name } 
            }));
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          () => {
            console.log('Upload complete');
            resolve();
          }
        );
      });

      // Get download URL
      const url = await getDownloadURL(task.snapshot.ref);

      // Save metadata to Firestore
      try {
        const docRef = await addDoc(collection(db, 'uploads'), {
          name: file.name,
          size: file.size,
          type: file.type,
          path,
          url,
          uploadedBy: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        console.log('Metadata saved with ID:', docRef.id);
      } catch (firestoreError) {
        console.error('Failed to save metadata:', firestoreError);
        // Continue even if metadata save fails
      }

      return { url, path };
    }

    // Expose API globally
    window.$firebase = {
      auth,
      storage,
      db,
      uploadFile,
      // Utility functions
      ref,
      uploadBytesResumable,
      getDownloadURL,
      collection,
      addDoc,
      serverTimestamp,
      // State check
      isReady: true,
      currentUser: () => auth.currentUser
    };

    // Signal ready state
    window.dispatchEvent(new Event('firebaseReady'));
    console.log('Firebase initialized successfully');

  } catch (error) {
    console.error('Firebase initialization failed:', error);
    window.$firebase = {
      isReady: false,
      error: error.message
    };
    window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
  }
})();