# SkillGate Frontend

Frontend monorepo for SkillGate web and mobile clients.

## Apps

- apps/web: React + Vite recruiter/candidate web app
- apps/mobile: Expo Router mobile app
- packages/shared: shared workspace package(s)

## Prerequisites

- Node.js 18+
- npm

## Install

From this folder:

```powershell
npm install
```

## Run Web

```powershell
npm run web
```

Web app default URL:

- http://localhost:5173

## Run Mobile

```powershell
npm run mobile
```

## Environment Configuration

### Web (apps/web/.env)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Optional WebRTC relay configuration:

```env
VITE_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
VITE_WEBRTC_TURN_URLS=turn:your-turn-server:3478?transport=udp,turn:your-turn-server:3478?transport=tcp
VITE_WEBRTC_TURN_USERNAME=your_turn_username
VITE_WEBRTC_TURN_CREDENTIAL=your_turn_password
```

### Mobile (apps/mobile/.env or app config env)

- EXPO_PUBLIC_API_URL should point to backend API base URL.

## Build And Quality

### Web lint

```powershell
cd apps/web
npm run lint
```

### Mobile lint

```powershell
cd apps/mobile
npm run lint -- --no-cache
```

## Deployment

- Deployed web entrypoint: https://skillgate-web.onrender.com/
- In production, web API base must point to deployed backend URL.

## Notes

- Keep backend running before starting web/mobile clients.
- The root frontend npm shell config is intentionally Linux-safe for cloud builds.
