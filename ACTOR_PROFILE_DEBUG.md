# 배우 프로필이 목록에 나타나지 않는 문제 해결

## 🔍 문제 진단

배우 프로필을 추가했는데 `/actors` 목록에 나타나지 않는 경우:

### 확인 사항

1. **`isPublic` 필드 확인**
   - Firebase 콘솔 → Firestore Database → 데이터
   - `actors` 컬렉션 → 내 uid 문서 확인
   - `isPublic` 필드가 `true`인지 확인

2. **프로필 저장 확인**
   - 프로필 저장 시 "프로필이 저장되었습니다!" 알림 확인
   - `isPublic` 체크박스가 체크되어 있는지 확인

3. **Firestore 인덱스 확인**
   - Firebase 콘솔 → Firestore Database → 인덱스
   - 다음 인덱스가 생성되어 있고 상태가 "Enabled"인지 확인:
     - 컬렉션: `actors`
     - 필드: `isPublic` (오름차순), `location` (오름차순), `ageRange` (오름차순), `createdAt` (내림차순)
     - 쿼리 범위: 컬렉션

## ✅ 해결 방법

### 방법 1: 프로필 다시 저장
1. `/actors/me` 페이지 접속
2. 공개 설정 체크박스 확인 (✅ 체크되어 있어야 함)
3. "프로필 저장" 클릭
4. 저장 후 `/actors` 페이지에서 확인

### 방법 2: Firestore에서 직접 확인
1. Firebase 콘솔 → Firestore Database → 데이터
2. `actors` 컬렉션에서 내 uid 문서 확인
3. `isPublic` 필드가 `false`이면:
   - 문서 수정
   - `isPublic` 필드를 `true`로 변경
   - 저장

### 방법 3: 인덱스 생성
인덱스가 없으면 쿼리가 실패합니다:
1. Firebase 콘솔 → Firestore Database → 인덱스
2. "인덱스 만들기" 클릭
3. 다음 설정:
   - 컬렉션 ID: `actors`
   - 필드:
     - `isPublic` (오름차순)
     - `location` (오름차순)
     - `ageRange` (오름차순)
     - `createdAt` (내림차순)
   - 쿼리 범위: 컬렉션
4. 만들기 클릭
5. 상태가 "Enabled"가 될 때까지 대기 (몇 분 소요)

## 🧪 테스트

1. 배우 프로필 생성/수정
2. 공개 설정 체크
3. 저장
4. `/actors` 페이지에서 내 프로필 확인
5. 필터링 테스트 (지역, 나이대)

## 💡 팁

- 프로필이 공개되어 있어도 필터 조건에 맞지 않으면 목록에 나타나지 않을 수 있습니다
- 예: 지역 필터가 "서울"로 설정되어 있는데 내 지역이 "부산"이면 나타나지 않음
- 필터를 "전체"로 설정하고 확인해보세요
