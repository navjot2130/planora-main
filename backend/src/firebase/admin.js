const admin = require('firebase-admin');

function buildPrivateKey(raw) {
  // Env var may contain escaped newlines (\n). Convert to real newlines.
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = buildPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    // eslint-disable-next-line no-console
    console.warn(
      '[firebase-admin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Check backend/.env'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };

