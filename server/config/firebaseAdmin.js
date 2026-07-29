const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let authInstance = null;

function getFirebaseAuth() {
  if (!authInstance) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
    authInstance = getAuth(app);
  }
  return authInstance;
}

module.exports = getFirebaseAuth;
