# Vercel 프로젝트 설정 가이드

## Vercel 프로젝트 생성 시 설정 값

### 1. 기본 설정

**Root Directory**
```
web
```
⚠️ 중요: 루트가 아닌 `web` 폴더를 지정해야 합니다!

**Framework Preset**
```
Next.js
```
(자동 감지되지만 확인)

**Build Command**
```
npm run build
```
또는
```
cd web && npm run build
```
(Root Directory를 `web`으로 설정했다면 `npm run build`만으로 충분)

**Output Directory**
```
.next
```
(Next.js 기본값, 자동 감지됨)

**Install Command**
```
npm install
```
(기본값 사용)

---

## 환경 변수 설정

### 필수 환경 변수

Vercel의 "Environment Variables" 섹션에서 다음 변수들을 추가하세요:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 환경 변수 값 찾는 방법

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. ⚙️ 설정 → 프로젝트 설정
4. "내 앱" 섹션에서 웹 앱 선택 (없으면 추가)
5. `firebaseConfig` 객체에서 값 복사

예시:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "indiefilm-hub.firebaseapp.com",  // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "indiefilm-hub",  // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "indiefilm-hub.appspot.com",  // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",  // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abcdef"  // ← NEXT_PUBLIC_FIREBASE_APP_ID
};
```

### 환경별 설정

Vercel에서는 각 환경별로 변수를 설정할 수 있습니다:
- **Production**: 프로덕션 배포용
- **Preview**: PR/브랜치 배포용
- **Development**: 로컬 개발용 (사용 안 함)

모든 환경에 동일한 값 설정하는 것을 권장합니다.

---

## 단계별 설정 가이드

### Step 1: 프로젝트 기본 정보
```
Project Name: indiefilm
Vercel Team: namhyukLee's projects (또는 개인 계정)
```

### Step 2: 빌드 설정
```
Root Directory: web
Framework Preset: Next.js (자동 감지)
Build Command: npm run build
Output Directory: .next (자동 감지)
Install Command: npm install (기본값)
```

### Step 3: 환경 변수 추가
"Environment Variables" 섹션에서:
1. "Add New" 클릭
2. Key와 Value 입력
3. 환경 선택 (Production, Preview, Development 모두 선택)
4. "Save" 클릭
5. 모든 Firebase 환경 변수 반복 추가

### Step 4: 배포
"Deploy" 버튼 클릭

---

## 설정 확인 체크리스트

배포 전 확인사항:

- [ ] Root Directory가 `web`으로 설정됨
- [ ] Build Command가 `npm run build`로 설정됨
- [ ] Output Directory가 `.next`로 설정됨
- [ ] 모든 Firebase 환경 변수가 추가됨 (6개)
- [ ] 환경 변수가 Production, Preview 환경에 모두 설정됨
- [ ] GitHub 레포지토리 연결 확인

---

## 문제 해결

### 빌드 실패 시

**에러: "Cannot find module"**
- Root Directory가 `web`인지 확인
- `web/package.json` 파일 존재 확인

**에러: "Environment variable not found"**
- 환경 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인
- Production 환경에 변수가 설정되었는지 확인

**에러: "Build output not found"**
- Output Directory가 `.next`인지 확인
- Build Command가 정상 실행되는지 확인

### 로컬에서 테스트

배포 전 로컬에서 빌드 테스트:
```bash
cd web
npm run build
```

성공하면 Vercel에서도 성공할 가능성이 높습니다.

---

## 배포 후 확인

1. 배포 완료 후 제공되는 URL로 접속
2. 브라우저 콘솔에서 에러 확인
3. Firebase 연결 확인
4. 로그인 기능 테스트

---

## 추가 설정 (선택사항)

### 커스텀 도메인
배포 완료 후:
1. 프로젝트 → Settings → Domains
2. 도메인 추가
3. DNS 설정 안내 따르기

### 환경 변수 자동 동기화
`.env.example` 파일 생성 (GitHub에 커밋):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

이렇게 하면 다른 개발자도 쉽게 환경 변수를 확인할 수 있습니다.
