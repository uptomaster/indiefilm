# Firebase Storage Rules 완성본 (프로덕션 모드)

## 📋 완성된 Rules

다음 규칙을 Firebase 콘솔에 복사하여 붙여넣으세요:

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
    
    // 영화 썸네일: thumbnails/{userId}/{fileName}
    match /thumbnails/{userId}/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만, 5MB 이하, 이미지 파일만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
    
    // 배우 프로필 사진: actors/{userId}/{fileName}
    match /actors/{userId}/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만, 5MB 이하, 이미지 파일만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
    
    // 배우 갤러리: actors/{userId}/gallery/{fileName}
    match /actors/{userId}/gallery/{fileName} {
      // 읽기: 모든 사람 (공개)
      allow read: if true;
      // 쓰기: 본인만, 5MB 이하, 이미지 파일만
      allow write: if isOwner(userId) && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
    
    // 기타 모든 경로는 거부
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔧 배포 방법

### 방법 1: Firebase 콘솔 (간단)

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `indiefilm-hub`
3. **Storage** → **규칙** 탭 클릭
4. 위의 규칙 전체를 복사하여 붙여넣기
5. **게시** 버튼 클릭

### 방법 2: Firebase CLI (고급)

```bash
# 프로젝트 루트에서
firebase deploy --only storage
```

## ✅ 보안 규칙 설명

### 읽기 권한
- **모든 사람**: `allow read: if true`
  - 프로필 사진과 갤러리는 공개적으로 볼 수 있음
  - 영화 썸네일도 공개적으로 볼 수 있음

### 쓰기 권한
- **본인만**: `allow write: if isOwner(userId)`
  - 로그인한 사용자만 업로드 가능
  - 자신의 폴더에만 업로드 가능
  - 다른 사용자의 폴더에는 업로드 불가

### 파일 제한
- **크기**: 5MB 이하만 허용
- **타입**: 이미지 파일만 허용 (`image/*`)

### 경로 구조
```
actors/{userId}/main_1234567890.png     ← 프로필 사진
actors/{userId}/gallery/image_123.png   ← 갤러리 이미지
thumbnails/{userId}/movie_123.jpg      ← 영화 썸네일
```

## 🔒 보안 특징

1. ✅ 인증 필수: 로그인한 사용자만 업로드 가능
2. ✅ 소유권 확인: 본인 파일만 수정/삭제 가능
3. ✅ 파일 크기 제한: 5MB 이하만 허용
4. ✅ 파일 타입 제한: 이미지 파일만 허용
5. ✅ 기타 경로 차단: 허용된 경로 외에는 모두 거부

## 🧪 테스트

Rules 배포 후 테스트:

1. 로그인한 상태에서 프로필 사진 업로드 시도
2. 로그아웃한 상태에서 업로드 시도 (실패해야 함)
3. 다른 사용자의 폴더에 업로드 시도 (실패해야 함)
4. 5MB 이상 파일 업로드 시도 (실패해야 함)
5. 이미지가 아닌 파일 업로드 시도 (실패해야 함)

## 📝 참고사항

- Rules 변경 후 즉시 적용됩니다
- Rules 문법 오류가 있으면 게시가 실패합니다
- Rules 테스트는 Firebase 콘솔의 "규칙 시뮬레이터"에서 가능합니다
