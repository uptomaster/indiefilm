# IndieFilm Hub 설정 가이드

## ✅ 완료된 작업
- [x] `.env.local` 파일 생성 (웹 앱용 Firebase 설정)
- [x] `lib/firebase.ts` 파일 생성 (Firebase 초기화 코드)

## 📋 다음 단계

### 1. Next.js 웹 프로젝트 생성

터미널에서 실행:

```powershell
npx create-next-app@latest web --ts --tailwind --app --eslint
```

질문이 나오면 기본값으로 Enter를 누르세요.

생성 후:
- `web/.env.local` 파일을 생성하고 루트의 `.env.local` 내용을 복사
- `web/lib/firebase.ts` 파일을 생성하고 루트의 `lib/firebase.ts` 내용을 복사

### 2. Expo 모바일 프로젝트 생성

터미널에서 실행:

```powershell
npx create-expo-app mobile -t expo-template-blank-typescript
```

### 3. Expo 프로젝트에 google-services.json 복사

**중요**: Expo에서는 Gradle 파일을 직접 수정하지 않습니다!

1. `google-services.json` 파일을 `mobile/` 폴더에 복사
2. `mobile/app.json` 또는 `mobile/app.config.ts` 파일 수정

#### 방법 A: app.json 사용 (간단)

`mobile/app.json` 파일에 다음 추가:

```json
{
  "expo": {
    "name": "IndieFilm Hub",
    "slug": "indiefilm-hub",
    "android": {
      "package": "com.namhyuk.indiefilmhub",
      "googleServicesFile": "./google-services.json"
    },
    "extra": {
      "EXPO_PUBLIC_FIREBASE_API_KEY": "AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE",
      "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "indiefilm-hub.firebaseapp.com",
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "indiefilm-hub",
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET": "indiefilm-hub.firebasestorage.app",
      "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "789760649620",
      "EXPO_PUBLIC_FIREBASE_APP_ID": "1:789760649620:web:b9623ec8c306493bd44781"
    }
  }
}
```

#### 방법 B: app.config.ts 사용 (권장)

`mobile/app.config.ts` 파일 생성:

```typescript
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "IndieFilm Hub",
  slug: "indiefilm-hub",
  android: {
    package: "com.namhyuk.indiefilmhub",
    googleServicesFile: "./google-services.json",
  },
  extra: {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE",
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "indiefilm-hub.firebaseapp.com",
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "indiefilm-hub",
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "indiefilm-hub.firebasestorage.app",
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "789760649620",
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:789760649620:web:b9623ec8c306493bd44781",
  },
});
```

그리고 `mobile/.env` 파일 생성:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA0ZTnMoeAgXJ6NnKZcbAXMdYkFTWSBvaE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=indiefilm-hub.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=indiefilm-hub
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=indiefilm-hub.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=789760649620
EXPO_PUBLIC_FIREBASE_APP_ID=1:789760649620:web:b9623ec8c306493bd44781
```

### 4. Expo Firebase 초기화 파일 생성

`mobile/src/firebase.ts` 파일 생성 (Expo용):

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from "expo-constants";

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

필요한 패키지 설치:

```powershell
cd mobile
npx expo install firebase @react-native-async-storage/async-storage expo-constants
```

## ⚠️ 중요 사항

### Gradle 설정은 필요 없습니다!

Firebase 문서에서 본 Gradle 설정(`build.gradle.kts`)은 **네이티브 Android 프로젝트**를 직접 다룰 때만 필요합니다.

**Expo를 사용하면:**
- `google-services.json` 파일만 `mobile/` 폴더에 넣고
- `app.json` 또는 `app.config.ts`에서 `googleServicesFile` 경로만 지정하면
- EAS Build 시 자동으로 처리됩니다!

### EAS Build 사용 시

Expo Go 앱에서는 `google-services.json`이 작동하지 않을 수 있습니다.  
실제 Android 빌드를 하려면:

```powershell
cd mobile
npx expo install eas-cli
npx eas build:configure
npx eas build --platform android
```

이렇게 하면 EAS가 자동으로 `google-services.json`을 처리합니다.

## 📝 체크리스트

- [ ] Next.js 웹 프로젝트 생성 (`web/` 폴더)
- [ ] Expo 모바일 프로젝트 생성 (`mobile/` 폴더)
- [ ] `google-services.json` 파일을 `mobile/` 폴더에 복사
- [ ] `mobile/app.json` 또는 `mobile/app.config.ts` 설정
- [ ] `mobile/.env` 파일 생성 (환경변수)
- [ ] `mobile/src/firebase.ts` 파일 생성
- [ ] 필요한 패키지 설치 (`@react-native-async-storage/async-storage`, `expo-constants`)

## 🚀 다음 단계

프로젝트 생성이 완료되면:
1. 웹 앱: 로그인 페이지 구현
2. 모바일 앱: 로그인 화면 구현
3. Firestore 스키마 설정
4. 영화/배우 업로드 기능 구현
