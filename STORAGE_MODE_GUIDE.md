# Firebase Storage 모드 가이드

## 🔒 프로덕션 모드 vs 테스트 모드

### 프로덕션 모드 (Production Mode)
- **보안 규칙 적용**: Storage Rules에 따라 접근 제어
- **안전함**: 인증된 사용자만 업로드 가능
- **권장**: 실제 서비스에 사용

**현재 Rules (프로덕션 모드):**
```javascript
// 배우 프로필 사진: actors/{userId}/{fileName}
match /actors/{userId}/{fileName} {
  allow read: if true;  // 모든 사람 읽기 가능
  allow write: if isOwner(userId) &&  // 본인만 쓰기 가능
                request.resource.size < 5 * 1024 * 1024 &&
                request.resource.contentType.matches('image/.*');
}
```

### 테스트 모드 (Test Mode)
- **개발 중에만 사용**: 30일 제한
- **보안 규칙 없음**: 누구나 읽기/쓰기 가능
- **위험함**: 프로덕션에 사용하면 안 됨

**테스트 모드 Rules:**
```javascript
match /{allPaths=**} {
  allow read, write: if request.time < timestamp.date(2025, 3, 14);
}
```

## ✅ 확인 방법

### Firebase 콘솔에서 확인

1. Firebase 콘솔 접속
2. Storage → 규칙 탭 클릭
3. 현재 규칙 확인:

**프로덕션 모드인 경우:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    match /actors/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) && ...
    }
  }
}
```

**테스트 모드인 경우:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time < timestamp.date(2025, 3, 14);
    }
  }
}
```

## 🔧 프로덕션 모드로 변경하기

현재 테스트 모드라면 프로덕션 모드로 변경해야 합니다:

1. Firebase 콘솔 → Storage → 규칙 탭
2. `storage.rules` 파일의 내용을 복사하여 붙여넣기
3. **게시** 버튼 클릭

## 📋 현재 프로젝트의 Rules

현재 `storage.rules` 파일에는 프로덕션 모드 규칙이 설정되어 있습니다:

- ✅ 인증된 사용자만 업로드 가능
- ✅ 본인 파일만 수정/삭제 가능
- ✅ 모든 사람이 읽기 가능 (공개)
- ✅ 파일 크기 제한 (5MB)
- ✅ 이미지 파일만 허용

## 🎯 권장사항

**프로덕션 모드를 사용하세요!**

이유:
1. 보안: 인증된 사용자만 업로드 가능
2. 안정성: 악의적인 업로드 방지
3. 무료: 프로덕션 모드도 무료 할당량 내에서 무료

테스트 모드는:
- 개발 중에만 사용
- 30일 후 자동으로 차단됨
- 보안 위험 있음

## ✅ 확인 체크리스트

- [ ] Firebase 콘솔 → Storage → 규칙 탭 확인
- [ ] `isOwner(userId)` 함수가 있는지 확인
- [ ] `allow write: if isOwner(userId)` 규칙이 있는지 확인
- [ ] 날짜 제한(`timestamp.date`)이 없는지 확인

위 항목들이 모두 있으면 **프로덕션 모드**입니다!
