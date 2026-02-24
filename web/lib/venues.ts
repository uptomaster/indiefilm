import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Venue {
  id: string;
  userId: string;
  name: string;
  description?: string;
  location: string;
  area?: number; // 면적 (㎡)
  pricePerHour?: number;
  pricePerDay?: number;
  availableHours?: string; // 대여 가능 시간대 (예: "09:00-22:00")
  photos?: Array<{ url: string; path: string }>;
  hasElectricity?: boolean;
  hasParking?: boolean;
  noiseRestriction?: string; // 소음 제한 설명
  amenities?: string[]; // 편의시설
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

/**
 * 장소 프로필 가져오기 (userId로)
 */
export async function getVenueByUserId(userId: string): Promise<Venue | null> {
  const docRef = doc(db, "venues", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    ...data,
  } as Venue;
}

/**
 * 공개된 장소 목록 가져오기
 */
export async function getVenues(options?: {
  limitCount?: number;
  location?: string;
}): Promise<Venue[]> {
  let q = query(
    collection(db, "venues"),
    where("isPublic", "==", true)
  );

  const snapshot = await getDocs(q);
  let venues: Venue[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.isPublic === true) {
      venues.push({
        id: docSnap.id,
        userId: data.userId || docSnap.id,
        ...data,
      } as Venue);
    }
  });

  if (options?.location) {
    venues = venues.filter(
      (v) =>
        v.location?.toLowerCase().includes(options.location!.toLowerCase())
    );
  }

  if (options?.limitCount) {
    venues = venues.slice(0, options.limitCount);
  }

  return venues;
}

/**
 * 장소 프로필 생성
 */
export async function createVenue(
  userId: string,
  data: Omit<Venue, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = doc(db, "venues", userId);
  await setDoc(docRef, {
    userId,
    ...data,
    isPublic: data.isPublic ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 장소 프로필 수정
 */
export async function updateVenue(
  userId: string,
  data: Partial<Omit<Venue, "id" | "userId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, "venues", userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
