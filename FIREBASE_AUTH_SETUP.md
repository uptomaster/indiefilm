# Firebase Authentication 설정 가이드

## 🔴 에러: CONFIGURATION_NOT_FOUND

이 에러는 Firebase 콘솔에서 Authentication 설정이 완료되지 않았을 때 발생합니다.

## ✅ 해결 방법

### 1단계: Firebase 콘솔에서 Authentication 활성화

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com
   - 프로젝트 선택: `indiefilm-hub`

2. **Authentication 메뉴 클릭**
   - 왼쪽 메뉴에서 **Authentication** 클릭
   - 처음이면 "시작하기" 버튼 클릭

3. **Sign-in method 탭 클릭**
   - 상단 탭에서 **Sign-in method** 선택

### 2단계: Email/Password 활성화

1. **Email/Password** 제공업체 클릭
2. **사용 설정** 토글을 **ON**으로 변경
3. **저장** 클릭

### 3단계: Google Sign-In 활성화 (중요!)

1. **Google** 제공업체 클릭
2. **사용 설정** 토글을 **ON**으로 변경
3. **프로젝트 지원 이메일** 선택 (기본값 사용 가능)
4. **저장** 클릭

⚠️ **중요**: Google Sign-In을 사용하려면 반드시 활성화해야 합니다!

### 4단계: 승인된 도메인 확인

1. Authentication → **Settings** 탭
2. **승인된 도메인** 섹션 확인
3. 다음 도메인이 있어야 합니다:
   - `localhost` (개발용)
   - `indiefilm-hub.firebaseapp.com` (프로덕션용)
   - 필요시 추가 도메인 추가

---

## 🔍 확인 체크리스트

Firebase 콘솔에서 확인:

- [ ] Authentication 메뉴가 활성화됨
- [ ] Email/Password 제공업체가 **사용 설정**됨
- [ ] Google 제공업체가 **사용 설정**됨
- [ ] 승인된 도메인에 `localhost`가 포함됨

---

## 🧪 테스트

설정 완료 후:

1. **브라우저 새로고침** (Ctrl+Shift+R)
2. **회원가입 페이지** 접속
3. **이메일/비밀번호** 회원가입 시도
4. **Google 로그인** 시도

---

## 💡 추가 확인사항

### 프로젝트 설정 확인

1. Firebase 콘솔 → 프로젝트 설정 (톱니바퀴 아이콘)
2. **일반** 탭에서:
   - 프로젝트 ID: `indiefilm-hub`
   - 프로젝트 번호: `789760649620`
3. **내 앱** 섹션에서 웹 앱이 등록되어 있는지 확인

### API 키 확인

1. 프로젝트 설정 → **일반** 탭
2. **내 앱** → 웹 앱 선택
3. SDK 설정 코드에서 API 키 확인
4. `web/.env.local`의 `NEXT_PUBLIC_FIREBASE_API_KEY`와 일치하는지 확인

---

## 🆘 여전히 안 되면

### 1. 프로젝트 재생성 (최후의 수단)

만약 위 방법으로 해결되지 않으면:
1. 새 Firebase 프로젝트 생성
2. 웹 앱 등록
3. Authentication 활성화
4. `.env.local` 파일 업데이트

### 2. Firebase 지원팀 문의

- Firebase 콘솔 → 도움말 및 지원
- 또는 Firebase 커뮤니티 포럼

---

## ✅ 성공 확인

다음이 모두 정상이면 성공:
- [ ] 이메일/비밀번호 회원가입 성공
- [ ] Google 로그인 팝업이 정상적으로 열림
- [ ] 에러 메시지 없음
