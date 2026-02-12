# IndieFilm Hub

인디 영화 제작자와 배우 지망생을 위한 네트워킹 플랫폼

## 프로젝트 소개

IndieFilm Hub는 대학생 동아리 및 인디 영화 제작자와 배우 지망생들이 서로를 찾고 협업할 수 있도록 돕는 통합 플랫폼입니다. 영화 제작, 캐스팅, 네트워킹을 한 곳에서 관리할 수 있습니다.

## 주요 기능

### 🎬 영화 관리
- 영화 업로드 및 포트폴리오 관리
- 영화 상태 관리 (제작중/제작예정/제작완료)
- 영화 평점 및 리뷰 시스템
- 장르별 필터링 및 정렬

### 👤 배우 프로필
- 배우 프로필 생성 및 관리
- 출연 작품 포트폴리오
- 특성 분석 (육각형 차트)
- MBTI 및 영화 취향 표시
- 데모 릴 업로드

### 🎥 제작자 프로필
- 제작자/팀 프로필 관리
- 필모그래피 관리
- 영화 편집 및 상태 관리
- 팀 멤버 관리

### 💬 커뮤니티
- 구인공고 및 배우 구직 게시판
- 협업 게시글 작성
- 댓글 및 상호작용

### 🔍 검색 및 필터링
- 통합 검색 기능 (영화, 배우, 제작자, 게시글)
- 고급 필터링 옵션
- 정렬 기능 (최신순/인기순/평점순)

### 📨 요청 및 채팅
- 캐스팅 제안 및 출연 희망 요청
- 실시간 채팅 기능
- 요청 상태 관리 (대기/수락/거절)

### 🔔 알림 시스템
- 실시간 알림
- 읽지 않은 요청 카운트
- Toast 알림

## 기술 스택

### Frontend
- **Web**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo
- **UI**: shadcn/ui, Radix UI
- **상태 관리**: React Hooks, Context API

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Hosting**: Vercel (Web), Expo (Mobile)

### 주요 라이브러리
- React Hook Form
- Zod (스키마 검증)
- Lucide Icons
- Firebase SDK

## 프로젝트 구조

```
IndiFilm/
├── web/                 # Next.js 웹 애플리케이션
│   ├── app/            # App Router 페이지
│   ├── components/     # React 컴포넌트
│   ├── lib/            # 유틸리티 및 Firebase 함수
│   └── hooks/          # Custom React Hooks
├── mobile/             # React Native 모바일 앱
├── firestore.rules     # Firestore 보안 규칙
├── storage.rules       # Storage 보안 규칙
└── docs/               # 프로젝트 문서

```

## 시작하기

### 필수 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Firebase 프로젝트

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/your-username/indiefilm-hub.git
cd indiefilm-hub
```

2. 의존성 설치
```bash
# 웹 앱
cd web
npm install

# 모바일 앱
cd ../mobile
npm install
```

3. 환경 변수 설정
```bash
# web/.env.local 파일 생성
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... 기타 Firebase 설정
```

4. 개발 서버 실행
```bash
# 웹 앱
cd web
npm run dev

# 모바일 앱
cd mobile
npm start
```

## Firebase 설정

Firebase 프로젝트 설정 및 보안 규칙은 다음 문서를 참고하세요:
- [Firebase Auth 설정](./FIREBASE_AUTH_SETUP.md)
- [Firestore 컬렉션 가이드](./FIRESTORE_COLLECTIONS_GUIDE.md)
- [Storage 설정](./FIREBASE_STORAGE_SETUP.md)

## 주요 기능 상세

### 영화 평점 시스템
- 사용자는 자유롭게 영화를 추가하고 평점을 남길 수 있습니다
- 인디 영화뿐만 아니라 모든 영화에 대한 평가 가능
- 인생영화 표시 기능

### 배우 특성 분석
- 육각형 차트를 통한 시각적 특성 표현
- 연기력, 외모, 카리스마, 감성, 유머 등 5가지 특성

### 실시간 채팅
- 요청 수락 후에도 지속적인 소통 가능
- Firestore 실시간 리스너 기반

## 기여하기

이슈를 등록하거나 Pull Request를 보내주시면 감사하겠습니다.

## 라이선스

이 프로젝트는 개인 포트폴리오 프로젝트입니다.

## 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.
