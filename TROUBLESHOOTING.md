# 문제 해결 가이드

## 🔴 Firebase: Error (auth/configuration-not-found)

### 원인
Firebase 설정이 제대로 로드되지 않았을 때 발생합니다.

### 해결 방법

#### 1. 개발 서버 재시작 (가장 중요!)
```powershell
# 터미널에서 Ctrl+C로 서버 중지 후
cd web
npm run dev
```

**중요**: `.env.local` 파일을 수정하거나 생성한 후에는 **반드시 개발 서버를 재시작**해야 합니다!

#### 2. .env.local 파일 확인
`web/.env.local` 파일이 다음 위치에 있는지 확인:
```
web/
  .env.local  ← 여기에 있어야 함!
```

파일 내용 확인:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=indiefilm-hub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=indiefilm-hub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=indiefilm-hub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=789760649620
NEXT_PUBLIC_FIREBASE_APP_ID=1:789760649620:web:b9623ec8c306493bd44781
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YPK8N0NN5W
```

#### 3. 브라우저 콘솔 확인
브라우저 개발자 도구(F12) → Console 탭에서:
- 환경변수 누락 에러 메시지 확인
- Firebase 초기화 에러 확인

#### 4. 파일 이름 확인
- `.env.local` (정확한 이름)
- `.env` (X)
- `env.local` (X)
- `.env.local.txt` (X)

---

## 🔴 역할 선택 후 변화가 없음

### 원인
1. Firestore에 프로필이 저장되지 않음
2. `useAuth` 훅이 업데이트되지 않음
3. Firestore Rules 권한 문제

### 해결 방법

#### 1. 브라우저 콘솔 확인
개발자 도구(F12) → Console 탭에서:
- "역할 선택 시작: [역할]" 메시지 확인
- "프로필 생성 완료" 메시지 확인
- 에러 메시지 확인

#### 2. Firestore 콘솔 확인
1. Firebase 콘솔 → Firestore Database → 데이터
2. `users` 컬렉션 확인
3. 내 uid로 문서가 생성되었는지 확인
4. `role` 필드가 올바르게 설정되었는지 확인

#### 3. Firestore Rules 확인
Firebase 콘솔 → Firestore Database → 규칙 탭:
```javascript
match /users/{userId} {
  allow read: if isSignedIn();
  allow create: if isOwner(userId);  // 본인만 생성 가능
  allow update: if isOwner(userId);  // 본인만 수정 가능
}
```

Rules가 제대로 게시되었는지 확인!

#### 4. 수동 새로고침
역할 선택 후:
- 브라우저에서 F5 또는 Ctrl+R로 새로고침
- 또는 주소창에 `/` 입력 후 Enter

---

## 🔴 Google 로그인 후 역할 선택 페이지로 안 감

### 원인
`signup/page.tsx`에서 Google 로그인 후 리다이렉트가 제대로 작동하지 않음

### 해결 방법

#### 1. 코드 확인
`web/app/(auth)/signup/page.tsx`의 `handleGoogleSignUp` 함수:
```typescript
const handleGoogleSignUp = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    // Google 로그인 후 역할 선택 페이지로 이동
    router.push("/role-select");
  } catch (err: any) {
    setError(err.message || "구글 회원가입에 실패했습니다");
  } finally {
    setLoading(false);
  }
};
```

#### 2. 강제 리다이렉트로 변경
```typescript
const handleGoogleSignUp = async () => {
  try {
    setLoading(true);
    setError(null);
    await signInWithGoogle();
    // 강제 리다이렉트
    window.location.href = "/role-select";
  } catch (err: any) {
    setError(err.message || "구글 회원가입에 실패했습니다");
    setLoading(false);
  }
};
```

---

## 🔴 Firestore 권한 에러

### 에러 메시지
```
Missing or insufficient permissions
```

### 해결 방법

#### 1. Firestore Rules 확인
Firebase 콘솔 → Firestore Database → 규칙 탭:
- `firestore.rules` 파일 내용이 게시되었는지 확인
- **게시** 버튼을 눌렀는지 확인

#### 2. 로그인 상태 확인
- 브라우저에서 로그인이 되어 있는지 확인
- 로그아웃 후 다시 로그인 시도

#### 3. 테스트 모드 (개발 중만!)
개발 중에는 임시로 테스트 모드 사용 가능:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

⚠️ **주의**: 프로덕션에서는 절대 사용하지 마세요!

---

## ✅ 체크리스트

문제 해결 전 확인사항:

- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] `.env.local` 파일이 `web/` 폴더에 있음
- [ ] `.env.local` 파일 내용이 올바름
- [ ] Firestore Rules가 게시됨
- [ ] Firestore 인덱스가 생성됨 (상태: "Enabled")
- [ ] 브라우저 콘솔에서 에러 메시지 확인
- [ ] Firestore 콘솔에서 데이터 확인

---

## 🆘 여전히 해결되지 않으면

1. **브라우저 콘솔 에러 메시지** 전체 복사
2. **Firebase 콘솔 스크린샷** (Firestore Rules, 인덱스 상태)
3. **터미널 에러 메시지** 확인

이 정보들을 알려주시면 더 정확한 해결책을 제시할 수 있습니다!
