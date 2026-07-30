// Firebase project config (safe to expose client-side — identifies the project, not a secret).
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBsUZi-u68bHY3ZFw-JOa-TGCcUvvynV7I',
  authDomain: 'retalla.firebaseapp.com',
  projectId: 'retalla',
  storageBucket: 'retalla.firebasestorage.app',
  messagingSenderId: '743391651770',
  appId: '1:743391651770:web:dc44a26298c130ccb89f83',
};

// From google.com/recaptcha/admin (reCAPTCHA v3), registered in Firebase Console > App Check.
// Also safe to expose client-side.
const RECAPTCHA_V3_SITE_KEY = '6LcngWstAAAAABhNVUcdNy3iieVk7EtxIIUoXYJl';
// Disabled for now: conflicted with Phone Auth's own reCAPTCHA verifier and broke OTP
// sign-in (auth/network-request-failed) on the live site. Re-enable once that's resolved.
const APP_CHECK_ENABLED = false;

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
  if (APP_CHECK_ENABLED && firebase.appCheck && RECAPTCHA_V3_SITE_KEY !== 'YOUR_RECAPTCHA_V3_SITE_KEY') {
    firebase.appCheck().activate(RECAPTCHA_V3_SITE_KEY, true);
  }
}
