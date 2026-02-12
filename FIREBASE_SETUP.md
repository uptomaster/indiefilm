# Firebase 설정 가이드

## 🔐 Firestore Security Rules 설정

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `indiefilm-hub`
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **규칙(Rules)** 클릭
5. `firestore.rules` 파일의 내용을 복사해서 붙여넣기
6. **게시** 버튼 클릭

## 📦 Storage Rules 설정

1. Firebase 콘솔에서 **Storage** 클릭
2. 상단 탭에서 **규칙(Rules)** 클릭
3. `storage.rules` 파일의 내용을 복사해서 붙여넣기
4. **게시** 버튼 클릭

## ⚠️ 중요 사항

### Firestore 인덱스 생성 필요

다음 쿼리들을 사용하려면 Firebase 콘솔에서 인덱스를 생성해야 합니다:

1. **영화 목록 (장르별 + 최신순)**
   - 컬렉션: `movies`
   - 필드: `genre` (오름차순), `createdAt` (내림차순)
   - 쿼리 범위: 컬렉션

2. **배우 목록 (지역별 + 나이대)**
   - 컬렉션: `actors`
   - 필드: 
     - `isPublic` (오름차순) ← **필터 조건 (먼저 추가!)**
     - `location` (오름차순)
     - `ageRange` (오름차순)
     - `createdAt` (내림차순)
   - 쿼리 범위: 컬렉션
   - **상세 가이드**: `FIREBASE_INDEX_GUIDE.md` 파일 참고

### 인덱스 생성 방법

1. Firestore Database → **인덱스(Indexes)** 탭
2. **인덱스 만들기** 클릭
3. 위의 필드들을 입력하고 생성
4. 인덱스가 생성될 때까지 몇 분 소요될 수 있습니다

## 🧪 테스트 모드 (개발 중)

개발 중에는 Security Rules를 테스트 모드로 설정할 수도 있습니다:

```javascript
// Firestore Rules (테스트 모드 - 개발용만!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

⚠️ **주의**: 테스트 모드는 프로덕션에서 사용하면 안 됩니다! 개발 완료 후 반드시 실제 Rules로 교체하세요.

## 📝 다음 단계

Security Rules 설정이 완료되면:
1. 웹 앱에서 로그인/회원가입 테스트
2. 영화 업로드 기능 테스트
3. 배우 프로필 생성 테스트
4. 실제 데이터로 Rules 동작 확인
