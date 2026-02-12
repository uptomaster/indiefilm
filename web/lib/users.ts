import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase";
import { getActorByUserId, Actor } from "./actors";
import { getFilmmakerByUserId, Filmmaker } from "./filmmakers";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "actor" | "filmmaker" | "viewer" | null;
  createdAt: any;
  updatedAt: any;
}

/**
 * 사용자 프로필 가져오기
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    ...docSnap.data(),
  } as UserProfile;
}

// 동명이인 처리를 위한 이름 캐시
let nameCache: Map<string, Array<{ id: string; createdAt: number }>> | null = null;
let nameCacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

/**
 * 모든 사용자의 이름 맵 생성 (캐시 사용)
 */
async function buildNameMap(): Promise<Map<string, Array<{ id: string; createdAt: number }>>> {
  const now = Date.now();
  
  // 캐시가 유효하면 재사용
  if (nameCache && (now - nameCacheTimestamp) < CACHE_DURATION) {
    return nameCache;
  }
  
  const nameMap = new Map<string, Array<{ id: string; createdAt: number }>>();
  const allUsersSnapshot = await getDocs(collection(db, "users"));
  
  // 배우와 제작자 프로필을 병렬로 가져오기
  const profilePromises = allUsersSnapshot.docs.map(async (userDoc) => {
    const userData = userDoc.data();
    const userId = userDoc.id;
    let displayName = "";
    
    try {
      if (userData.role === "actor") {
        const actor = await getActorByUserId(userId);
        if (actor && actor.stageName) {
          displayName = actor.stageName;
        }
      } else if (userData.role === "filmmaker") {
        const filmmaker = await getFilmmakerByUserId(userId);
        if (filmmaker) {
          if (filmmaker.type === "team") {
            const personalName = userData.displayName || userData.email?.split("@")[0] || userId.slice(0, 8);
            displayName = `${filmmaker.name} - ${personalName}`;
          } else {
            displayName = filmmaker.name || "";
          }
        }
      }
      
      if (!displayName) {
        displayName = userData.displayName || userData.email?.split("@")[0] || userId.slice(0, 8);
      }
      
      if (displayName) {
        const createdAt = userData.createdAt?.toMillis?.() || userData.createdAt || 0;
        if (!nameMap.has(displayName)) {
          nameMap.set(displayName, []);
        }
        nameMap.get(displayName)!.push({ id: userId, createdAt });
      }
    } catch (error) {
      console.error(`Error loading profile for ${userId}:`, error);
    }
  });
  
  await Promise.all(profilePromises);
  
  // 캐시 업데이트
  nameCache = nameMap;
  nameCacheTimestamp = now;
  
  return nameMap;
}

/**
 * 동명이인 처리를 포함한 이름 가져오기
 */
async function getUserDisplayNameWithSuffix(userId: string, baseName: string): Promise<string> {
  try {
    const nameMap = await buildNameMap();
    const sameNameUsers = nameMap.get(baseName) || [];
    
    // 자기 자신 제외
    const otherUsers = sameNameUsers.filter(u => u.id !== userId);
    
    // 동명이인이 있으면 접미사 추가
    if (otherUsers.length > 0) {
      // 현재 사용자 정보 가져오기
      const currentProfile = await getUserProfile(userId);
      const currentCreatedAt = currentProfile?.createdAt?.toMillis?.() || currentProfile?.createdAt || 0;
      
      // 생성 시간 순으로 정렬
      const allUsers = [{ id: userId, createdAt: currentCreatedAt }, ...otherUsers];
      allUsers.sort((a, b) => a.createdAt - b.createdAt);
      
      const index = allUsers.findIndex(u => u.id === userId);
      const suffix = String.fromCharCode(65 + index); // A, B, C...
      
      return `${baseName} ${suffix}`;
    }
    
    return baseName;
  } catch (error) {
    console.error("Error checking duplicate names:", error);
    // 에러 발생 시 원래 이름 반환
    return baseName;
  }
}

/**
 * 사용자 표시 이름 가져오기 (역할별로 다른 형식)
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return userId.slice(0, 8);
  }
  
  // 배우인 경우: <예명>
  if (profile.role === "actor") {
    const actor = await getActorByUserId(userId);
    if (actor && actor.stageName) {
      return await getUserDisplayNameWithSuffix(userId, actor.stageName);
    }
  }
  
  // 제작자인 경우
  if (profile.role === "filmmaker") {
    const filmmaker = await getFilmmakerByUserId(userId);
    if (filmmaker) {
      if (filmmaker.type === "team") {
        // 팀인 경우: <팀명> - <개인명>
        const personalName = profile.displayName || profile.email?.split("@")[0] || userId.slice(0, 8);
        const teamName = `${filmmaker.name} - ${personalName}`;
        return await getUserDisplayNameWithSuffix(userId, teamName);
      } else {
        // 개인 제작자인 경우: <이름>
        if (filmmaker.name) {
          return await getUserDisplayNameWithSuffix(userId, filmmaker.name);
        }
      }
    }
  }
  
  // 프로필이 없거나 역할이 없는 경우
  if (profile.displayName) {
    return await getUserDisplayNameWithSuffix(userId, profile.displayName);
  }
  
  if (profile.email) {
    // 이메일의 @ 앞부분 사용
    const emailName = profile.email.split("@")[0];
    return await getUserDisplayNameWithSuffix(userId, emailName);
  }
  
  // 둘 다 없으면 userId의 처음 8자리
  return userId.slice(0, 8);
}
