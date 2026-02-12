# 환경변수 확인 가이드

## 🔍 문제 진단

`auth/configuration-not-found` 에러는 Firebase Auth가 제대로 초기화되지 않았을 때 발생합니다.

## ✅ 확인 단계

### 1. 파일 위치 확인
`.env.local` 파일이 **반드시** `web/` 폴더에 있어야 합니다:
```
IndiFilm/
  web/
    .env.local  ← 여기!
    package.json
    lib/
      firebase.ts
```

### 2. 파일 내용 확인
`web/.env.local` 파일에 다음이 모두 있어야 합니다:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=indiefilm-hub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=indiefilm-hub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=indiefilm-hub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=789760649620
NEXT_PUBLIC_FIREBASE_APP_ID=1:789760649620:web:b9623ec8c306493bd44781
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YPK8N0NN5W
```

### 3. 개발 서버 재시작 (필수!)
```powershell
# 1. 터미널에서 Ctrl+C로 서버 완전히 중지
# 2. 다시 시작
cd web
npm run dev
```

### 4. 브라우저 캐시 클리어
- Windows: `Ctrl + Shift + R`
- 또는 개발자 도구(F12) → Network 탭 → "Disable cache" 체크

### 5. 브라우저 콘솔 확인
F12 → Console 탭에서:
- "현재 환경변수 상태" 메시지 확인
- 어떤 환경변수가 ✗로 표시되는지 확인

---

## 🛠️ 해결 방법

### 방법 1: 파일 재생성
1. `web/.env.local` 파일 삭제
2. 새로 생성하고 위 내용 복사
3. 개발 서버 재시작

### 방법 2: 파일 인코딩 확인
- 파일이 UTF-8 인코딩인지 확인
- Windows 메모장으로 열어서 "다른 이름으로 저장" → 인코딩: UTF-8 선택

### 방법 3: 하드코딩 (임시 테스트용)
`web/lib/firebase.ts` 파일에서 임시로 하드코딩:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE",
  authDomain: "indiefilm-hub.firebaseapp.com",
  // ... 나머지도 하드코딩
};
```
⚠️ **주의**: 테스트 후 반드시 환경변수로 되돌리세요!

---

## 🔬 디버깅

브라우저 콘솔에서 실행:
```javascript
// 환경변수 확인
console.log({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ...
});
```

터미널에서 확인:
```powershell
cd web
# 환경변수 출력 (Windows PowerShell)
Get-Content .env.local
```

---

## 💡 Next.js 환경변수 특징

1. **서버 시작 시에만 로드됨**: `.env.local` 수정 후 반드시 서버 재시작 필요
2. **클라이언트에서 접근**: `NEXT_PUBLIC_` 접두사 필요
3. **빌드 타임에 포함**: 환경변수가 코드에 포함됨

---

## ✅ 성공 확인

다음이 모두 정상이면 성공:
- [ ] 브라우저 콘솔에 "현재 환경변수 상태" 모든 항목이 ✓
- [ ] 회원가입 페이지에서 에러 없음
- [ ] Firebase 초기화 성공 메시지 없음
