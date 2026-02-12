# 배포 및 도메인 연결 가이드

## 배포 플랫폼 선택

### 1. Vercel (권장)
- Next.js에 최적화된 플랫폼
- 무료 플랜 제공
- 자동 HTTPS
- 간편한 도메인 연결

### 2. Firebase Hosting
- Firebase 프로젝트와 통합 용이
- 무료 플랜 제공
- CDN 자동 구성

### 3. Netlify
- 무료 플랜 제공
- 간편한 설정

---

## Vercel 배포 및 도메인 연결

### 1단계: Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 레포지토리 연결
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)
   - **Install Command**: `npm install`

5. 환경 변수 설정:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

6. "Deploy" 클릭

### 2단계: 도메인 연결

#### 방법 A: Vercel에서 도메인 구매
1. 프로젝트 설정 → Domains
2. "Buy Domain" 클릭
3. 원하는 도메인 검색 및 구매
4. 자동으로 연결됨

#### 방법 B: 기존 도메인 연결

**Vercel 설정:**
1. 프로젝트 설정 → Domains
2. "Add Domain" 클릭
3. 도메인 입력 (예: `indiefilmhub.com`)

**도메인 제공업체 설정 (예: 가비아, 후이즈, Cloudflare 등):**

**A레코드 방식 (루트 도메인):**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP - 변경될 수 있으니 Vercel에서 확인)
TTL: 3600
```

**CNAME 방식 (서브도메인):**
```
Type: CNAME
Name: www (또는 원하는 서브도메인)
Value: cname.vercel-dns.com
TTL: 3600
```

**Vercel 권장 설정:**
- 루트 도메인: A 레코드 또는 ALIAS 레코드
- www 서브도메인: CNAME → `cname.vercel-dns.com`

### 3단계: DNS 확인 및 SSL 인증서

1. Vercel이 자동으로 DNS 확인 (몇 분 ~ 몇 시간 소요)
2. 확인 완료 후 자동으로 SSL 인증서 발급 (Let's Encrypt)
3. HTTPS 자동 활성화

---

## Firebase Hosting 배포 및 도메인 연결

### 1단계: Firebase CLI 설치

```bash
npm install -g firebase-tools
firebase login
```

### 2단계: Firebase 프로젝트 초기화

```bash
cd web
firebase init hosting
```

설정 선택:
- **What do you want to use as your public directory?**: `.next`
- **Configure as a single-page app?**: No
- **Set up automatic builds and deploys with GitHub?**: 선택사항

### 3단계: next.config.ts 수정

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 정적 내보내기 (선택사항)
  // 또는
  // trailingSlash: true,
}

module.exports = nextConfig
```

### 4단계: 빌드 및 배포

```bash
cd web
npm run build
firebase deploy --only hosting
```

### 5단계: 도메인 연결

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택 → Hosting
3. "Add custom domain" 클릭
4. 도메인 입력
5. DNS 설정 안내에 따라 도메인 제공업체에서 설정:

**A 레코드:**
```
Type: A
Name: @
Value: 151.101.1.195 (Firebase IP)
```

**CNAME:**
```
Type: CNAME
Name: www
Value: your-project.web.app
```

6. Firebase가 자동으로 SSL 인증서 발급

---

## Cloudflare를 통한 도메인 관리 (권장)

### 장점
- 무료 CDN
- DDoS 보호
- 빠른 DNS 전파
- 무료 SSL

### 설정 방법

1. [Cloudflare](https://cloudflare.com) 가입
2. 도메인 추가
3. Cloudflare 네임서버로 변경 (도메인 제공업체에서)
4. DNS 레코드 추가:

**Vercel 사용 시:**
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: ON (주황색 구름)
```

**Firebase Hosting 사용 시:**
```
Type: CNAME
Name: @
Target: your-project.web.app
Proxy: ON
```

5. SSL/TLS 설정:
   - **SSL/TLS encryption mode**: Full (strict)
   - 자동 HTTPS 리다이렉트 활성화

---

## 환경 변수 설정

### Vercel
1. 프로젝트 → Settings → Environment Variables
2. 각 환경별로 변수 추가:
   - Production
   - Preview
   - Development

### Firebase Hosting
`.env.production` 파일 생성 후:
```bash
firebase functions:config:set env.production="true"
```

또는 Firebase Functions와 함께 사용하는 경우:
```bash
firebase functions:config:set firebase.api_key="your_key"
```

---

## 커스텀 도메인 설정 체크리스트

- [ ] 도메인 구매 또는 기존 도메인 준비
- [ ] DNS 레코드 설정 (A 또는 CNAME)
- [ ] DNS 전파 대기 (최대 48시간, 보통 몇 분~몇 시간)
- [ ] SSL 인증서 자동 발급 확인
- [ ] HTTPS 리다이렉트 설정
- [ ] 환경 변수 설정 확인
- [ ] 빌드 성공 확인
- [ ] 도메인으로 접속 테스트

---

## 문제 해결

### DNS 전파 확인
```bash
# Windows
nslookup your-domain.com

# Mac/Linux
dig your-domain.com
```

### SSL 인증서 발급 지연
- DNS 전파 완료 후 최대 24시간 소요 가능
- Vercel/Firebase 콘솔에서 상태 확인

### 환경 변수 미적용
- 빌드 후 재배포 필요
- Vercel: Settings → Environment Variables 확인
- Firebase: Functions Config 확인

### 빌드 실패
- 로컬에서 `npm run build` 테스트
- 빌드 로그 확인
- 의존성 문제 확인

---

## 추천 설정

### 프로덕션 환경
- **배포 플랫폼**: Vercel
- **도메인 관리**: Cloudflare
- **CDN**: Cloudflare (자동)
- **SSL**: 자동 (Let's Encrypt)

### 비용
- Vercel: 무료 (개인 프로젝트)
- Cloudflare: 무료
- 도메인: 연간 약 $10-15 (`.com` 기준)

---

## 추가 리소스

- [Vercel 도메인 문서](https://vercel.com/docs/concepts/projects/domains)
- [Firebase Hosting 문서](https://firebase.google.com/docs/hosting)
- [Cloudflare DNS 설정](https://developers.cloudflare.com/dns/)
