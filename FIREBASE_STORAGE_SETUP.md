# Firebase Storage 설정 가이드

## 🔧 Storage 활성화

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `indiefilm-hub`
3. 왼쪽 메뉴에서 **Storage** 클릭
4. **시작하기** 버튼 클릭
5. **프로덕션 모드로 시작** 선택 (나중에 규칙 수정 가능)
6. **다음** 클릭
7. Storage 위치 선택 (권장: `asia-northeast3` - 서울)
8. **완료** 클릭

## 📋 Storage Rules 배포

Storage Rules 파일(`storage.rules`)을 Firebase에 배포해야 합니다:

### 방법 1: Firebase CLI 사용 (권장)

```bash
# Firebase CLI 설치 (아직 안 했다면)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화 (아직 안 했다면)
firebase init storage

# Rules 배포
firebase deploy --only storage
```

### 방법 2: Firebase 콘솔에서 직접 수정

1. Firebase 콘솔 → Storage → 규칙 탭
2. 다음 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // 헬퍼 함수: 로그인 확인
    function isSignedIn() {
      return request.auth != null;
    }
    
    // 헬퍼 함수: 본인 확인
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // 영화 썸네일: thumbnails/{userId}/{movieId}.{ext}
    match /thumbnails/{userId}/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
    
    // 배우 프로필 사진: actors/{userId}/{fileName}
    match /actors/{userId}/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
    
    // 배우 갤러리: actors/{userId}/gallery/{fileName}
    match /actors/{userId}/gallery/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. **게시** 버튼 클릭

## ✅ 확인 사항

1. **Storage 활성화 확인**
   - Firebase 콘솔 → Storage → 파일 탭
   - 빈 폴더가 보이면 정상

2. **Rules 배포 확인**
   - Firebase 콘솔 → Storage → 규칙 탭
   - 위의 규칙이 적용되어 있는지 확인

3. **CORS 설정** (일반적으로 자동 설정됨)
   - Firebase Storage는 기본적으로 CORS를 지원합니다
   - 문제가 계속되면 Firebase 지원팀에 문의

## 🐛 문제 해결

### CORS 에러가 계속 발생하는 경우

1. **Storage가 활성화되었는지 확인**
   - Firebase 콘솔 → Storage
   - "시작하기" 버튼이 보이면 아직 활성화되지 않음

2. **Rules가 올바르게 배포되었는지 확인**
   - Firebase 콘솔 → Storage → 규칙 탭
   - 규칙이 저장되어 있는지 확인

3. **인증 상태 확인**
   - 브라우저 콘솔에서 `firebase.auth().currentUser` 확인
   - 로그인되어 있어야 업로드 가능

4. **파일 크기 확인**
   - 5MB 이하인지 확인
   - 이미지 파일인지 확인

## 💡 참고사항

- Storage는 Firebase 무료 플랜에서도 사용 가능합니다
- 일일 무료 할당량: 5GB 저장, 1GB 다운로드
- 초과 시 Blaze 플랜으로 업그레이드 필요
