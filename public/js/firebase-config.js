// Firebase project config (safe to expose client-side — identifies the project, not a secret).
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBsUZi-u68bHY3ZFw-JOa-TGCcUvvynV7I',
  authDomain: 'retalla.firebaseapp.com',
  projectId: 'retalla',
  storageBucket: 'retalla.firebasestorage.app',
  messagingSenderId: '743391651770',
  appId: '1:743391651770:web:dc44a26298c130ccb89f83',
};

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
