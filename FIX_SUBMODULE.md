# Git 서브모듈 문제 해결

## 문제

GitHub에서 `web`과 `mobile`이 Git 서브모듈로 등록되어 있습니다.
Vercel이 클론할 때 서브모듈이 초기화되지 않아 `web` 폴더가 비어있습니다.

## 해결 방법

### Git Bash에서 실행:

```bash
# 1. 서브모듈 제거
git rm --cached web
git rm --cached mobile

# 2. web 폴더를 일반 폴더로 추가
git add web/
git add mobile/

# 3. .gitmodules 파일 삭제 (있다면)
rm .gitmodules
git add .gitmodules

# 4. 커밋
git commit -m "Fix: Convert submodules to regular folders"

# 5. 푸시
git push origin main
```

### 또는 더 확실한 방법:

```bash
# 1. 서브모듈 제거
git submodule deinit -f web
git submodule deinit -f mobile
git rm --cached web
git rm --cached mobile

# 2. .gitmodules 삭제
rm -f .gitmodules

# 3. web 폴더 내용 추가
git add web/
git add mobile/
git add .gitmodules 2>/dev/null || true

# 4. 커밋 및 푸시
git commit -m "Fix: Remove submodules and add web folder as regular directory"
git push origin main
```

## 확인

푸시 후 GitHub에서 확인:
- `web` 폴더가 일반 폴더로 표시되어야 함
- `web/package.json` 파일이 보여야 함
- 서브모듈 아이콘이 없어야 함

## 푸시 후 Vercel 설정

```
Root Directory: web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

이제 정상 작동할 것입니다!
