# Vercel 빠른 설정 가이드

## 현재 상황

GitHub 레포지토리에 `web` 폴더가 보이지 않는 경우, 다음을 확인하세요:

### 1. GitHub에 푸시 확인

먼저 GitHub 레포지토리에 `web` 폴더가 있는지 확인:
```bash
# GitHub 레포지토리 페이지에서 확인
# https://github.com/your-username/indiefilm
```

만약 `web` 폴더가 없다면:

```bash
# 1. 모든 변경사항 커밋
git add .
git commit -m "Add web application"

# 2. GitHub에 푸시
git push origin main
# 또는
git push origin master
```

### 2. Vercel 설정 방법

#### 방법 A: web 폴더가 GitHub에 있는 경우

**Root Directory 선택:**
- 화면에서 `web` 폴더를 찾아서 선택
- 없으면 "indiefilm (root)" 선택 후 아래 설정 사용

**설정 값:**
```
Root Directory: web (또는 indiefilm (root))
Build Command: cd web && npm run build
Output Directory: web/.next
Install Command: cd web && npm install
```

#### 방법 B: web 폴더가 GitHub에 없는 경우 (임시 해결)

**Root Directory:**
```
indiefilm (root)
```

**Build Command:**
```
cd web && npm run build
```

**Output Directory:**
```
web/.next
```

**Install Command:**
```
cd web && npm install
```

⚠️ 이 방법은 임시 해결책입니다. 정상적으로는 `web` 폴더를 GitHub에 푸시한 후 Root Directory를 `web`으로 설정하는 것이 좋습니다.

### 3. 환경 변수 설정

`.env.local` 파일의 값들을 Vercel에 추가:

**Vercel → Environment Variables 섹션에서:**

1. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Value: `AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE`

2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Value: `indiefilm-hub.firebaseapp.com`

3. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Value: `indiefilm-hub`

4. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Value: `indiefilm-hub.firebasestorage.app`

5. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Value: `789760649620`

6. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Value: `1:789760649620:web:b9623ec8c306493bd44781`

7. **NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID** (선택사항)
   - Value: `G-YPK8N0NN5W`

**각 변수 추가 시:**
- Key: 위의 변수명 그대로 입력
- Value: 위의 값 입력
- 환경: Production, Preview 모두 체크

### 4. 최종 설정 요약

| 항목 | 설정 값 |
|------|---------|
| Root Directory | `web` (있으면) 또는 `indiefilm (root)` |
| Build Command | `cd web && npm run build` |
| Output Directory | `web/.next` |
| Install Command | `cd web && npm install` |
| Environment Variables | 위 7개 변수 추가 |

### 5. 다음 단계

1. GitHub에 `web` 폴더 푸시 확인
2. Vercel에서 Root Directory를 `web`으로 변경 (가능하면)
3. 환경 변수 모두 추가
4. Deploy 클릭

---

## 문제 해결

### web 폴더가 보이지 않는 경우

**원인:** GitHub에 아직 푸시되지 않음

**해결:**
```bash
# 1. 현재 위치 확인
pwd

# 2. web 폴더가 있는지 확인
ls web

# 3. Git에 추가
git add web/
git commit -m "Add web folder"
git push origin main
```

### 빌드 실패 시

**에러: "Cannot find module"**
- Build Command에 `cd web &&` 추가 확인
- Install Command에 `cd web &&` 추가 확인

**에러: "Environment variable not found"**
- 모든 환경 변수가 `NEXT_PUBLIC_`로 시작하는지 확인
- Production 환경에 설정되었는지 확인
