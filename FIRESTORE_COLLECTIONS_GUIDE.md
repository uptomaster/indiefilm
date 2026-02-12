# Firestore 컬렉션 구조 가이드

## 📚 현재 프로젝트의 컬렉션 목록

현재 IndieFilm Hub 프로젝트에서 사용하는 Firestore 컬렉션은 다음과 같습니다:

### 1. `users` 컬렉션
**필요 시점**: 회원가입 시 자동 생성  
**용도**: 사용자 기본 정보 (이메일, 역할 등)  
**생성 위치**: `web/lib/auth.ts` - 회원가입 시

```typescript
// 회원가입 시 자동 생성
await setDoc(doc(db, "users", user.uid), {
  email: user.email,
  displayName: user.displayName,
  role: role, // "actor" | "filmmaker" | "viewer"
  createdAt: serverTimestamp(),
});
```

### 2. `actors` 컬렉션
**필요 시점**: 배우가 프로필을 처음 생성할 때  
**용도**: 배우 프로필 정보 (예명, 나이대, 경력, 스킬 등)  
**생성 위치**: `web/app/actors/me/edit/page.tsx` - 프로필 저장 시

```typescript
// 배우 프로필 생성 시
await createOrUpdateActorProfile(user.uid, {
  stageName: "...",
  ageRange: "...",
  // ...
});
```

### 3. `movies` 컬렉션
**필요 시점**: 제작자가 영화를 업로드할 때  
**용도**: 영화 정보 (제목, 장르, 영상 URL, 제작진 등)  
**생성 위치**: `web/app/movies/new/page.tsx` - 영화 업로드 시

```typescript
// 영화 업로드 시
await addDoc(collection(db, "movies"), {
  title: "...",
  genre: "...",
  // ...
});
```

### 4. `filmmakers` 컬렉션
**필요 시점**: 제작자가 프로필을 처음 생성할 때  
**용도**: 제작자 프로필 정보 (이름, 전문 분야, 보유 장비 등)  
**생성 위치**: `web/app/filmmakers/me/edit/page.tsx` - 프로필 저장 시

```typescript
// 제작자 프로필 생성 시
await createOrUpdateFilmmakerProfile(user.uid, {
  type: "individual" | "team",
  name: "...",
  // ...
});
```

### 5. `movieRatings` 컬렉션
**필요 시점**: 사용자가 영화에 평점을 남길 때  
**용도**: 영화 평점 및 리뷰  
**생성 위치**: `web/lib/movieRatings.ts` - 평점 저장 시

```typescript
// 영화 평점 저장 시
await addDoc(collection(db, "movieRatings"), {
  userId: "...",
  movieTitle: "...",
  rating: 5,
  // ...
});
```

### 6. `requests` 컬렉션
**필요 시점**: 배우가 출연 희망하거나 제작자가 캐스팅 제안할 때  
**용도**: 캐스팅 요청/출연 희망 메시지  
**생성 위치**: `web/app/movies/[id]/page.tsx`, `web/app/actors/[id]/page.tsx`

```typescript
// 출연 희망 요청 시
await addDoc(collection(db, "requests"), {
  type: "movie_application",
  fromUserId: "...",
  toUserId: "...",
  // ...
});
```

## 🔄 Firestore 컬렉션 자동 생성

**중요**: Firestore는 **NoSQL 데이터베이스**이므로, 컬렉션을 Firebase 콘솔에서 미리 만들 필요가 **없습니다**.

### 자동 생성 원리
1. 코드에서 `addDoc(collection(db, "컬렉션명"), {...})` 또는 `setDoc(doc(db, "컬렉션명", "ID"), {...})`를 실행하면
2. 해당 컬렉션이 존재하지 않으면 **자동으로 생성**됩니다
3. 첫 번째 문서가 추가되면 컬렉션이 생성됩니다

### 예시
```typescript
// 이 코드가 실행되면 "movies" 컬렉션이 자동 생성됩니다
await addDoc(collection(db, "movies"), {
  title: "첫 번째 영화",
  // ...
});
```

## 📋 컬렉션별 필요 시점 정리

| 컬렉션 | 필요 시점 | 누가 생성 | 필수 여부 |
|--------|----------|----------|----------|
| `users` | 회원가입 시 | 모든 사용자 | ✅ 필수 |
| `actors` | 배우 프로필 생성 시 | 배우 역할 사용자 | ⚠️ 배우만 |
| `movies` | 영화 업로드 시 | 제작자 역할 사용자 | ⚠️ 제작자만 |
| `filmmakers` | 제작자 프로필 생성 시 | 제작자 역할 사용자 | ⚠️ 제작자만 |
| `movieRatings` | 영화 평점 남길 때 | 모든 로그인 사용자 | 선택 |
| `requests` | 출연 희망/캐스팅 제안 시 | 배우/제작자 | 선택 |

## 🎯 현재 프로젝트 상태

### 이미 구현된 컬렉션
- ✅ `users` - 회원가입 시 자동 생성
- ✅ `actors` - 배우 프로필 생성 시 자동 생성
- ✅ `movies` - 영화 업로드 시 자동 생성
- ✅ `filmmakers` - 제작자 프로필 생성 시 자동 생성
- ✅ `movieRatings` - 영화 평점 저장 시 자동 생성
- ✅ `requests` - 요청 생성 시 자동 생성

### Firebase 콘솔에서 확인하는 방법
1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `indiefilm-hub`
3. **Firestore Database** 클릭
4. **데이터** 탭에서 컬렉션 목록 확인

## ⚠️ 주의사항

1. **컬렉션 이름 오타 주의**
   - `movies`와 `movie`는 다른 컬렉션입니다
   - 코드에서 사용하는 이름과 Firestore Rules의 이름이 일치해야 합니다

2. **Security Rules 필수**
   - 모든 컬렉션에 대한 Security Rules가 `firestore.rules`에 정의되어 있어야 합니다
   - Rules가 없으면 읽기/쓰기가 거부됩니다

3. **인덱스 필요 시**
   - 복합 쿼리(여러 필드로 필터링 + 정렬)를 사용하면 인덱스가 필요할 수 있습니다
   - 에러 메시지에 인덱스 생성 링크가 포함되어 있습니다

## 📝 결론

**답변**: `actors`와 `users`만 있으면 **안 됩니다!**

현재 프로젝트는 다음 컬렉션들이 모두 필요합니다:
- `users` - 사용자 정보
- `actors` - 배우 프로필
- `movies` - 영화 정보
- `filmmakers` - 제작자 프로필
- `movieRatings` - 영화 평점
- `requests` - 요청/알림

하지만 **Firebase 콘솔에서 미리 만들 필요는 없습니다**. 코드가 실행되면 자동으로 생성됩니다!

## 🔍 컬렉션 확인 방법

Firebase 콘솔에서 확인:
1. Firestore Database → 데이터 탭
2. 각 컬렉션이 사용될 때 자동으로 나타납니다

또는 코드에서 확인:
- `web/lib/` 폴더의 각 파일에서 `collection(db, "컬렉션명")`을 검색하면 됩니다
