// lib/storage.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

// Storage가 사용 가능한지 확인하는 헬퍼 함수
function checkStorageAvailable() {
  if (!storage) {
    throw new Error(
      "Firebase Storage가 활성화되지 않았습니다.\n\n" +
      "해결 방법:\n" +
      "1. Firebase 콘솔에서 Storage 활성화\n" +
      "2. Storage Rules 배포\n" +
      "3. 브라우저 새로고침\n\n" +
      "자세한 내용은 FIREBASE_STORAGE_SETUP.md 참고"
    );
  }
}

/**
 * 이미지 파일을 Firebase Storage에 업로드
 * @param file 업로드할 파일
 * @param path 저장 경로 (예: "actors/userId/main.jpg")
 * @returns 다운로드 URL
 */
export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  try {
    // Storage 사용 가능 여부 확인
    checkStorageAvailable();

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드할 수 있습니다.");
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("파일 크기는 5MB 이하여야 합니다.");
    }

    const storageRef = ref(storage!, path);
    console.log("📤 업로드 시작:", path);
    console.log("📄 파일 정보:", { name: file.name, size: file.size, type: file.type });
    
    const snapshot = await uploadBytes(storageRef, file);
    console.log("✅ 업로드 완료:", snapshot.metadata.fullPath);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("🔗 다운로드 URL:", downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error("❌ 이미지 업로드 실패:", error);
    
    // CORS 에러인 경우 특별한 메시지 표시
    if (error.message?.includes("CORS") || error.code === "storage/unauthorized") {
      throw new Error(
        "Storage 업로드 권한이 없습니다.\n\n" +
        "해결 방법:\n" +
        "1. Firebase 콘솔에서 Storage 활성화 확인\n" +
        "2. Storage Rules 배포 확인\n" +
        "3. 로그인 상태 확인\n" +
        "4. 브라우저 새로고침\n\n" +
        "자세한 내용은 FIREBASE_STORAGE_SETUP.md 참고"
      );
    }
    
    throw new Error(error.message || "이미지 업로드에 실패했습니다.");
  }
}

/**
 * Firebase Storage에서 파일 삭제
 * @param path 삭제할 파일 경로
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    checkStorageAvailable();
    const storageRef = ref(storage!, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error("이미지 삭제 실패:", error);
    // 삭제 실패해도 계속 진행 (파일이 없을 수도 있음)
  }
}

/**
 * 배우 프로필 사진 업로드
 */
export async function uploadActorPhoto(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const fileName = `main_${timestamp}.${file.name.split(".").pop()}`;
  const path = `actors/${userId}/${fileName}`;
  const url = await uploadImage(file, path);
  return { url, path };
}

/**
 * 배우 갤러리 이미지 업로드
 */
export async function uploadActorGalleryImage(
  file: File,
  userId: string,
  index: number
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const fileName = `gallery_${index}_${timestamp}.${file.name.split(".").pop()}`;
  const path = `actors/${userId}/gallery/${fileName}`;
  const url = await uploadImage(file, path);
  return { url, path };
}

/**
 * 영화 썸네일 업로드
 */
export async function uploadMovieThumbnail(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const fileName = `thumbnail_${timestamp}.${file.name.split(".").pop()}`;
  const path = `thumbnails/${userId}/${fileName}`;
  const url = await uploadImage(file, path);
  return { url, path };
}
