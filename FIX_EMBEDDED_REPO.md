# 중첩된 Git 저장소 문제 해결

## 문제

`web` 폴더 안에 `.git` 폴더가 있어서 Git이 이를 중첩된 저장소로 인식하고 있습니다.

## 해결 방법

### Git Bash에서 실행:

```bash
# 1. web/.git 폴더 제거 (또는 백업)
rm -rf web/.git

# 2. web 폴더를 일반 폴더로 추가
git add web/

# 3. 상태 확인
git status

# 4. 커밋
git commit -m "Fix: Remove embedded git repository from web folder"

# 5. 푸시
git push origin main
```

## 주의사항

`web/.git`을 삭제하면:
- `web` 폴더의 Git 히스토리가 사라집니다
- 하지만 파일들은 그대로 유지됩니다
- 루트 저장소에 통합됩니다

## 확인

푸시 후 GitHub에서:
- `web` 폴더가 일반 폴더로 표시되어야 함
- `web/package.json` 파일이 보여야 함
- 서브모듈 아이콘이 없어야 함
