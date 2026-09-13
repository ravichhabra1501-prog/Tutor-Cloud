import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Critical Constraint: Test connection to Firestore on initialization
async function testConnection() {
  try {
    // Attempt to fetch a dummy document from the server to verify Firestore access
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection test: SUCCESS");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration: Firestore client is offline.");
    } else {
      console.warn("Firestore connection test completed (expected permissions warning if not authenticated):", error.message);
    }
  }
}

testConnection();
