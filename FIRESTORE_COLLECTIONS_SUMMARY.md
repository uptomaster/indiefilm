# Firestore 컬렉션 요약

## 🎯 핵심 답변

**Q: actors랑 users만 있어도 되는거야?**  
**A: 아니요!** 현재 프로젝트는 **6개의 컬렉션**이 모두 필요합니다.

## 📦 현재 사용 중인 컬렉션 (6개)

### 1. `users` ✅ 필수
- **언제 생성**: 회원가입 시 자동 생성
- **용도**: 사용자 기본 정보 (이메일, 역할)
- **생성 코드**: `web/lib/auth.ts`

### 2. `actors` ✅ 배우 기능 사용 시 필요
- **언제 생성**: 배우가 프로필을 처음 저장할 때
- **용도**: 배우 프로필 정보
- **생성 코드**: `web/lib/actors.ts` → `createOrUpdateActorProfile()`

### 3. `movies` ✅ 영화 기능 사용 시 필요
- **언제 생성**: 제작자가 영화를 업로드할 때
- **용도**: 영화 정보
- **생성 코드**: `web/app/movies/new/page.tsx` → `addDoc(collection(db, "movies"))`

### 4. `filmmakers` ✅ 제작자 프로필 기능 사용 시 필요
- **언제 생성**: 제작자가 프로필을 처음 저장할 때
- **용도**: 제작자 프로필 정보
- **생성 코드**: `web/lib/filmmakers.ts` → `createOrUpdateFilmmakerProfile()`

### 5. `movieRatings` ⚠️ 영화 평점 기능 사용 시 필요
- **언제 생성**: 사용자가 영화에 평점을 남길 때
- **용도**: 영화 평점 및 리뷰
- **생성 코드**: `web/lib/movieRatings.ts` → `createOrUpdateMovieRating()`

### 6. `requests` ⚠️ 요청/알림 기능 사용 시 필요
- **언제 생성**: 출연 희망 또는 캐스팅 제안 시
- **용도**: 요청/알림 메시지
- **생성 코드**: `web/app/movies/[id]/page.tsx`, `web/app/actors/[id]/page.tsx`

## 🔄 Firestore의 자동 생성 원리

**중요**: Firestore는 **NoSQL 데이터베이스**입니다!

### ✅ 자동 생성됨
- 코드에서 `addDoc()` 또는 `setDoc()`을 실행하면
- 해당 컬렉션이 **자동으로 생성**됩니다
- Firebase 콘솔에서 미리 만들 필요가 **없습니다**

### 예시
```typescript
// 이 코드가 실행되면 "movies" 컬렉션이 자동 생성됩니다
await addDoc(collection(db, "movies"), {
  title: "첫 번째 영화",
  // ...
});
```

## 📋 컬렉션별 생성 시점

| 컬렉션 | 생성 시점 | 누가 생성 |
|--------|----------|----------|
| `users` | 회원가입 시 | 모든 사용자 |
| `actors` | 배우 프로필 저장 시 | 배우 역할 사용자 |
| `movies` | 영화 업로드 시 | 제작자 역할 사용자 |
| `filmmakers` | 제작자 프로필 저장 시 | 제작자 역할 사용자 |
| `movieRatings` | 영화 평점 저장 시 | 모든 로그인 사용자 |
| `requests` | 요청 생성 시 | 배우/제작자 |

## 🎯 현재 프로젝트 상태

### 이미 구현된 기능들
- ✅ 회원가입/로그인 → `users` 컬렉션 사용
- ✅ 배우 프로필 → `actors` 컬렉션 사용
- ✅ 영화 업로드 → `movies` 컬렉션 사용
- ✅ 제작자 프로필 → `filmmakers` 컬렉션 사용
- ✅ 영화 평점 → `movieRatings` 컬렉션 사용
- ✅ 출연 희망/캐스팅 → `requests` 컬렉션 사용

**결론**: 모든 컬렉션이 이미 코드에 구현되어 있고, 사용될 때 자동으로 생성됩니다!

## 🔍 Firebase 콘솔에서 확인하는 방법

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `indiefilm-hub`
3. **Firestore Database** → **데이터** 탭
4. 각 기능을 사용하면 컬렉션이 자동으로 나타납니다

예:
- 회원가입 → `users` 컬렉션 생성
- 배우 프로필 저장 → `actors` 컬렉션 생성
- 영화 업로드 → `movies` 컬렉션 생성
- 제작자 프로필 저장 → `filmmakers` 컬렉션 생성
- 영화 평점 저장 → `movieRatings` 컬렉션 생성
- 출연 희망 요청 → `requests` 컬렉션 생성

## ⚠️ 주의사항

1. **Security Rules 필수**
   - 모든 컬렉션에 대한 Rules가 `firestore.rules`에 정의되어 있어야 합니다
   - Rules가 없으면 읽기/쓰기가 거부됩니다

2. **컬렉션 이름 일치**
   - 코드에서 사용하는 이름과 Rules의 이름이 일치해야 합니다
   - 예: `movies`와 `movie`는 다른 컬렉션입니다

3. **인덱스 필요 시**
   - 복합 쿼리 사용 시 인덱스가 필요할 수 있습니다
   - 에러 메시지에 생성 링크가 포함되어 있습니다

## 📝 결론

**답변**: `actors`와 `users`만으로는 **부족합니다**.

현재 프로젝트는 다음 **6개 컬렉션**이 모두 필요합니다:
1. `users` - 사용자 정보
2. `actors` - 배우 프로필
3. `movies` - 영화 정보
4. `filmmakers` - 제작자 프로필
5. `movieRatings` - 영화 평점
6. `requests` - 요청/알림

하지만 **Firebase 콘솔에서 미리 만들 필요는 없습니다**. 코드가 실행되면 자동으로 생성됩니다!
