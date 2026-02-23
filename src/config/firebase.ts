import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT as string,
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
