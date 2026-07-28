const admin = require('firebase-admin');

let initialized = false;

function getFirebaseAdmin() {
  if (!initialized) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }
  return admin;
}

module.exports = getFirebaseAdmin;
