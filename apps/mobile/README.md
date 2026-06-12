# SkillGate Mobile App

Expo Router mobile client for SkillGate recruiter/candidate workflows.

## Features

- Mobile recruiter dashboard views
- Candidate interview and assessment visibility
- Shared API integration with SkillGate backend
- Mobile-friendly picker/dropdown interactions

## Setup

1. Install dependencies:

```powershell
npm install
```

2. Configure API URL for mobile:

- Set EXPO_PUBLIC_API_URL to your backend base URL.

3. Start Expo dev server:

```powershell
npm run start
```

## Lint

```powershell
npm run lint -- --no-cache
```

## Notes

- This app uses Expo Router file-based routing.
- Keep backend running before opening mobile flows that call API.
- Mobile workspace keeps a local npm shell setting for Windows script compatibility.
