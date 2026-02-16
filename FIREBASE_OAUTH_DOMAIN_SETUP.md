# Firebase OAuth 도메인 설정 가이드

## 문제
구글 로그인 시 `Firebase: Error (auth/unauthorized-domain)` 에러가 발생합니다.

## 해결 방법

### 1. Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택 (`indiefilm-hub`)

### 2. Authentication 설정으로 이동
1. 왼쪽 사이드바에서 **Authentication** 클릭
2. 상단 탭에서 **Settings** 클릭
3. **Authorized domains** 탭 클릭

### 3. 도메인 추가
다음 도메인들을 추가해야 합니다:

#### 필수 도메인:
- ✅ `indiefilm.vercel.app` (Vercel 배포 도메인)
- ✅ `localhost` (로컬 개발용 - 이미 있을 수 있음)

#### 커스텀 도메인이 있다면:
- ✅ `yourdomain.com` (커스텀 도메인)
- ✅ `www.yourdomain.com` (www 서브도메인)

### 4. 도메인 추가 방법
1. **Authorized domains** 목록에서 **Add domain** 버튼 클릭
2. 도메인 입력 (예: `indiefilm.vercel.app`)
3. **Add** 클릭

### 5. 확인
도메인 추가 후:
- 페이지를 새로고침
- 구글 로그인 다시 시도
- 정상 작동 확인

## 주의사항

⚠️ **도메인 형식:**
- 프로토콜(`https://`) 제외하고 입력
- 포트 번호 제외 (예: `localhost:3000` ❌, `localhost` ✅)
- 서브도메인은 별도로 추가 필요 (예: `www.example.com`)

⚠️ **변경사항 적용 시간:**
- 도메인 추가 후 즉시 적용되지만, 때로는 몇 분 걸릴 수 있음
- 브라우저 캐시를 지우고 다시 시도

## 현재 설정 확인

현재 Firebase 프로젝트의 승인된 도메인 목록:
- `localhost` (기본값)
- `your-project.firebaseapp.com` (기본값)
- `your-project.web.app` (기본값)

**추가 필요:**
- `indiefilm.vercel.app` ← **이것을 추가해야 함!**

## Vercel 커스텀 도메인 사용 시

만약 커스텀 도메인을 연결했다면:
1. Vercel 프로젝트 설정에서 커스텀 도메인 확인
2. Firebase 콘솔에 해당 도메인도 추가

예:
- `indiefilm.com` → Firebase에 추가
- `www.indiefilm.com` → Firebase에 추가 (별도로)

## 참고 링크

- [Firebase 공식 문서 - Authorized domains](https://firebase.google.com/docs/auth/web/google-signin#configure_oauth_redirect_urls)
- [Vercel 도메인 설정](https://vercel.com/docs/concepts/projects/domains)
