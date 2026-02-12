# Vercel 빌드 문제 해결

## 문제 분석

빌드 로그를 보면:
- "Build Completed in /vercel/output [85ms]" - 너무 빠름 (비정상)
- "Skipping cache upload because no files were prepared" - 빌드 출력 없음
- 실제 `npm run build` 실행 로그가 없음

이는 빌드가 실제로 실행되지 않았다는 의미입니다.

## 해결 방법

### 1. Vercel 설정 확인 및 수정

**현재 설정:**
```
Root Directory: web
Build Command: npm run build (자동 감지)
Output Directory: .next (자동 감지)
```

**문제:** Vercel이 빌드를 실행하지 않고 있습니다.

### 2. Build Command 명시적으로 설정

Vercel 대시보드에서:
1. Settings → General → Build & Development Settings
2. "Override" 클릭
3. **Build Command**를 명시적으로 설정:
   ```
   cd web && npm run build
   ```
4. **Output Directory** 확인:
   ```
   web/.next
   ```
   또는 Root Directory가 `web`이면:
   ```
   .next
   ```

### 3. Framework Preset 확인

**문제:** Framework Preset이 "Other"로 설정되어 있을 수 있습니다.

**해결:**
1. Settings → General
2. Framework Preset을 "Next.js"로 변경
3. 또는 "Override" 클릭하여 수동 설정

### 4. 올바른 설정 (Root Directory: web인 경우)

```
Root Directory: web
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 5. 올바른 설정 (Root Directory: ./인 경우)

```
Root Directory: ./
Framework Preset: Next.js
Build Command: cd web && npm run build
Output Directory: web/.next
Install Command: cd web && npm install
```

## 권장 설정

**가장 안전한 방법:**

1. **Root Directory**: `web` (권장)
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

이렇게 설정하면 Vercel이 `web` 폴더를 루트로 인식하고, 그 안에서 빌드를 실행합니다.

## 재배포

설정 변경 후:
1. Deployments 탭
2. 최신 배포 → "..." → "Redeploy"
3. 빌드 로그에서 실제 빌드 실행 확인:
   - "Running install command" 확인
   - "Running build command" 확인
   - "Compiling..." 메시지 확인
   - 빌드가 몇 분 걸려야 정상

## 빌드 로그 확인 포인트

정상적인 빌드 로그에는 다음이 포함되어야 합니다:
```
Running "install" command: npm install
added XXX packages...
Running "build" command: npm run build
> next build
Creating an optimized production build...
Compiling /...
Route (app)                              Size     First Load JS
...
```

85ms에 완료되는 것은 빌드가 실행되지 않았다는 의미입니다.
