# 서브모듈 문제 즉시 해결

## 현재 문제

GitHub에 `web`이 서브모듈로 등록되어 있어서 Vercel이 클론할 때 `web` 폴더가 비어있습니다.

## 즉시 해결 방법

### Git Bash에서 실행 (IndiFilm 루트에서):

```bash
# 1. 현재 상태 확인
git status

# 2. 서브모듈로 등록된 web 제거
git rm --cached web

# 3. web 폴더의 모든 파일을 일반 파일로 추가
git add web/

# 4. 상태 확인
git status

# 5. 커밋
git commit -m "Fix: Remove web submodule and add as regular folder"

# 6. 푸시
git push origin main
```

## 중요 확인사항

푸시 전에 확인:
- `git status`에서 `web/` 폴더의 파일들이 보여야 함
- `web/package.json`이 포함되어야 함

## 푸시 후

1. GitHub에서 확인:
   - `web` 폴더가 일반 폴더로 표시되는지
   - `web/package.json` 파일이 보이는지

2. Vercel 설정:
   ```
   Root Directory: web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. 재배포

## 문제가 계속되면

만약 `git rm --cached web`이 작동하지 않으면:

```bash
# 강제로 제거
git rm -rf --cached web
git add web/
git commit -m "Force remove submodule"
git push origin main
```
