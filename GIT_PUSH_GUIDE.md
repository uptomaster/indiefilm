# Git 푸시 가이드

## 현재 상황

변경사항이 스테이징되어 있지만 커밋되지 않았습니다. 
GitHub에는 초기 커밋만 있고, `web` 폴더의 모든 파일들이 아직 푸시되지 않았습니다.

## 해결 방법

### 1단계: 모든 변경사항 커밋

```bash
git commit -m "Add IndieFilm Hub complete application

- Next.js 웹 애플리케이션 (web 폴더)
- 모든 페이지 및 컴포넌트
- Firebase 통합
- 배우/제작자 프로필 시스템
- 영화 관리 시스템
- 커뮤니티 게시판
- 실시간 채팅
- 통합 검색 기능
- Toast 알림 시스템
- 스켈레톤 로더
- 에러 바운더리"
```

### 2단계: GitHub에 푸시

```bash
git push origin main
```

또는 브랜치가 `master`인 경우:
```bash
git push origin master
```

### 3단계: Vercel 재배포

푸시 후 Vercel이 자동으로 재배포합니다.
또는 Vercel 대시보드에서 "Redeploy" 버튼 클릭

## 확인 방법

푸시 후 GitHub에서 확인:
1. https://github.com/uptomaster/indiefilm 접속
2. `web/package.json` 파일 클릭
3. `"build": "next build"` 스크립트가 있는지 확인

## 문제 해결

### 푸시가 안 되는 경우

**에러: "remote: Permission denied"**
```bash
# 원격 저장소 확인
git remote -v

# 올바른 URL인지 확인
# https://github.com/uptomaster/indiefilm.git
```

**에러: "branch 'main' has no upstream branch"**
```bash
git push -u origin main
```

### 커밋이 안 되는 경우

**에러: "nothing to commit"**
- 이미 커밋된 상태일 수 있음
- `git log`로 확인

**에러: "Please tell me who you are"**
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```
