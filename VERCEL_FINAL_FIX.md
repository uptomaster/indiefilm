# Vercel 최종 해결 방법

## 문제 분석

**루트 `package.json`:**
- `firebase` 의존성만 있음
- `build` 스크립트 없음 (방금 추가함)

**`web/package.json`:**
- Next.js, React 등 모든 의존성 있음
- `build: "next build"` 스크립트 있음

**현재 상황:**
- GitHub에는 `web` 폴더가 없고 루트에 파일들이 있음
- Vercel이 루트에서 `npm install` 실행 → `web` 폴더의 의존성 설치 안 됨
- Vercel이 루트에서 `npm run build` 실행 → 루트의 `build` 스크립트는 `cd web && npm run build`인데, `web` 폴더가 없어서 실패

## 해결 방법

### 방법 1: Vercel 설정 수정 (권장)

**Vercel 대시보드 설정:**

```
Root Directory: (비워두기)
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**하지만 이 방법도 문제:** Install Command가 루트에서 실행되면 `web` 폴더의 의존성이 설치되지 않습니다.

### 방법 2: 루트 package.json 수정 (가장 확실)

루트 `package.json`에 `install` 스크립트 추가:

```json
{
  "scripts": {
    "install": "cd web && npm install",
    "build": "cd web && npm run build"
  }
}
```

그리고 Vercel 설정:
```
Root Directory: (비워두기)
Build Command: npm run build
Output Directory: web/.next
Install Command: npm run install
```

### 방법 3: GitHub 구조 확인 및 수정 (근본적 해결)

GitHub에 실제로 `web` 폴더가 있는지 확인하고, 없다면:
1. Git 저장소를 루트로 이동
2. `web` 폴더 구조로 푸시
3. Vercel에서 Root Directory를 `web`으로 설정

## 즉시 해결책

**지금 바로 할 수 있는 것:**

1. 루트 `package.json`에 `install` 스크립트 추가 (이미 `build`는 추가됨)
2. Vercel 설정:
   ```
   Root Directory: (비워두기)
   Install Command: npm run install
   Build Command: npm run build
   Output Directory: web/.next
   ```
3. 커밋 및 푸시
4. 재배포
