import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, googleProvider, db } from "./firebase";
import { UserRole } from "@/hooks/useAuth";

// auth가 undefined일 수 있으므로 안전하게 처리
const auth = firebaseAuth;

export async function signInWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Firestore에 사용자 프로필 저장
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return userCredential;
}

export async function signInWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function createUserProfile(
  user: User,
  role: UserRole,
  displayName?: string
) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || null,
    photoURL: user.photoURL || null,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function logout() {
  return await signOut(auth);
}
