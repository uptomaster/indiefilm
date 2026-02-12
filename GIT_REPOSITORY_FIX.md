# Git 저장소 구조 수정 가이드

## 현재 문제

- Git 저장소가 `web` 폴더 안에 있음
- GitHub에는 `web` 폴더 없이 루트에 파일들이 올라감
- Vercel이 `cd web`을 실행할 수 없음

## 해결 방법: Git 저장소를 루트로 이동

### 방법 1: Git 저장소 이동 (권장)

**Git Bash에서 실행:**

```bash
# 1. 루트로 이동
cd ..

# 2. web/.git을 루트로 이동
mv web/.git .git

# 3. web 폴더의 모든 파일을 Git에 추가
git add web/
git add .
git status

# 4. 커밋
git commit -m "Reorganize: Move Git repository to root and add web folder structure"

# 5. 푸시
git push origin main
```

### 방법 2: 새로 초기화 (더 깔끔)

```bash
# 1. 루트로 이동
cd ..

# 2. 기존 .git 백업 (선택사항)
mv web/.git web/.git.backup

# 3. 루트에 새 Git 저장소 초기화
git init
git remote add origin https://github.com/uptomaster/indiefilm.git

# 4. 모든 파일 추가
git add .
git commit -m "Reorganize repository structure with web folder"

# 5. 강제 푸시 (기존 히스토리 덮어쓰기)
git push -f origin main
```

## 푸시 후 Vercel 설정

GitHub에 `web` 폴더가 올라간 후:

```
Root Directory: web
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## 빠른 해결 (임시)

지금 당장 배포하려면, 루트 package.json 수정:

```json
{
  "scripts": {
    "install": "npm install",
    "build": "npm run build"
  }
}
```

그리고 Vercel 설정:
```
Root Directory: (비워두기)
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

하지만 이 방법은 프로젝트 구조가 이상해집니다.
