# Vercel 404 에러 해결 가이드

## 문제 원인

404 에러는 일반적으로 다음 중 하나입니다:
1. Output Directory 설정이 잘못됨
2. 빌드가 실패했지만 배포는 성공한 경우
3. Next.js 빌드 출력 경로 문제

## 해결 방법

### 1. Vercel 프로젝트 설정 확인

Vercel 대시보드 → 프로젝트 → Settings → General에서 확인:

**현재 설정 (잘못된 경우):**
```
Root Directory: ./
Build Command: cd web && npm run build
Output Directory: web/.next
```

**올바른 설정:**
```
Root Directory: web
Build Command: npm run build
Output Directory: .next
```

### 2. 설정 변경 방법

1. Vercel 대시보드 접속
2. 프로젝트 선택 (`indiefilm`)
3. Settings → General
4. "Root Directory" 섹션에서:
   - "Edit" 클릭
   - `web` 입력
   - "Save" 클릭

5. "Build & Development Settings" 섹션에서:
   - **Framework Preset**: Next.js (자동 감지)
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `.next` (자동 감지됨)
   - **Install Command**: `npm install` (기본값)

### 3. 재배포

설정 변경 후:
1. "Deployments" 탭으로 이동
2. 최신 배포 옆 "..." 메뉴 클릭
3. "Redeploy" 선택
4. 또는 GitHub에 새로운 커밋 푸시 (자동 재배포)

### 4. 빌드 로그 확인

배포 실패 시:
1. "Deployments" 탭
2. 실패한 배포 클릭
3. "Build Logs" 확인
4. 에러 메시지 확인

## 일반적인 문제 및 해결

### 문제 1: Output Directory가 `web/.next`로 설정됨

**해결:**
- Root Directory를 `web`으로 설정하면 자동으로 `.next`로 인식됨
- Output Directory를 비워두거나 `.next`로 설정

### 문제 2: 빌드 실패

**확인사항:**
- 환경 변수가 모두 설정되었는지 확인
- `web/package.json`에 `build` 스크립트가 있는지 확인
- 빌드 로그에서 구체적인 에러 확인

### 문제 3: 파일 경로 문제

**확인:**
- `web/app/page.tsx` 파일이 존재하는지 확인
- GitHub 레포지토리에서 파일 구조 확인

## 빠른 체크리스트

- [ ] Root Directory: `web`
- [ ] Build Command: `npm run build` (또는 자동 감지)
- [ ] Output Directory: `.next` (또는 자동 감지)
- [ ] 환경 변수 7개 모두 설정됨
- [ ] GitHub에 `web/package.json`이 있고 `build` 스크립트 포함
- [ ] 빌드 로그에 에러가 없음

## 추가 디버깅

Vercel CLI로 로컬에서 테스트:
```bash
cd web
npm install
npm run build
```

빌드가 성공하면 Vercel에서도 성공해야 합니다.
