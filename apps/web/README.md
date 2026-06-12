# SkillGate Web App

React + Vite web client for recruiter and candidate workflows.

## Features

- Role-based login and protected routes
- Recruiter dashboard for challenges, assessments, candidates, and interviews
- Candidate portal for timed assessments and attempt review
- Live interview room access
- Interview and notification data integration

## Local Setup

1. Install deps:

```powershell
npm install
```

2. Configure env in apps/web/.env:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

3. Start dev server:

```powershell
npm run dev
```

4. Open app:

- http://localhost:5173

## Production URL

- https://skillgate-web.onrender.com/

## Scripts

- npm run dev
- npm run build
- npm run preview
- npm run lint

## Auth Session Behavior

- Session is persisted in localStorage under skillgate.web.session.
- On app bootstrap, token validity is checked and profile is revalidated.
- Failed refresh or invalid session clears state and redirects to login.

## Troubleshooting

- If you see 401 repeatedly, clear localStorage session and log in again.
- If network calls fail, verify backend is running and VITE_API_BASE_URL is correct.
