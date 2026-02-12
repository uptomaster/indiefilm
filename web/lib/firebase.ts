// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// 환경변수 가져오기
const getFirebaseConfig = () => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // 환경변수 누락 체크
  const missingVars: string[] = [];
  if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) missingVars.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missingVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missingVars.length > 0) {
    const errorMsg = `❌ Firebase 환경변수가 누락되었습니다: ${missingVars.join(", ")}\n\n💡 해결 방법:\n1. web/.env.local 파일 확인\n2. 개발 서버 재시작 (npm run dev)\n3. 브라우저 캐시 클리어 (Ctrl+Shift+R)`;
    
    console.error(errorMsg);
    
    if (typeof window !== "undefined") {
      console.error("현재 환경변수 상태:", {
        apiKey: apiKey ? "✓" : "✗",
        authDomain: authDomain ? "✓" : "✗",
        projectId: projectId ? "✓" : "✗",
        storageBucket: storageBucket ? "✓" : "✗",
        messagingSenderId: messagingSenderId ? "✓" : "✗",
        appId: appId ? "✓" : "✗",
      });
    }
    
    throw new Error(`Firebase 환경변수 누락: ${missingVars.join(", ")}`);
  }

  return {
    apiKey: apiKey!,
    authDomain: authDomain!,
    projectId: projectId!,
    storageBucket: storageBucket!,
    messagingSenderId: messagingSenderId!,
    appId: appId!,
    measurementId: measurementId,
  };
};

// Firebase 초기화
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage | undefined;

try {
  const firebaseConfig = getFirebaseConfig();
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  
  // Storage 초기화 (Storage Bucket이 설정되어 있는 경우에만)
  try {
    if (firebaseConfig.storageBucket) {
      storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
      console.log("✅ Firebase Storage 초기화 완료");
    } else {
      console.warn("⚠️ Storage Bucket이 설정되지 않았습니다.");
      // storage는 undefined로 남김
    }
  } catch (storageError: any) {
    console.error("⚠️ Storage 초기화 실패:", storageError);
    // Storage 초기화 실패해도 앱은 계속 실행
  }
} catch (error: any) {
  console.error("❌ Firebase 초기화 실패:", error);
  
  if (typeof window !== "undefined") {
    console.error("에러 상세:", error.message);
  }
  
  throw error;
}

export { auth, db };
export { storage };
export const googleProvider = new GoogleAuthProvider();
