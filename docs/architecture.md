# SkillGate Architecture (Design Phase)

## 1) Product Goal
SkillGate is an AI-powered technical interview and hiring platform for candidates and recruiters.

Primary outcomes:
- Candidates complete coding challenges and timed assessments.
- Recruiters manage jobs, interview pipelines, and decisions.
- AI generates feedback and interview support.

## 2) Mandatory Requirement Mapping
- Full-stack JavaScript: React + React Native + Node.js + Express + MongoDB.
- WebSockets: Real-time collaborative coding editor and interview events.
- Rich text/code editors: Monaco Editor (web), code editor for mobile review mode.
- Complex state management: Redux Toolkit + RTK Query + websocket event reducers.
- Database design: Normalized collections with role-aware ownership and audit fields.
- Security: JWT auth, RBAC, input validation, rate limiting, secure headers, encryption at rest in provider.
- AI integration: LLM-based feedback generation and rubric analysis service.

## 3) High-Level Architecture
Client layer:
- Web app: Candidate and Recruiter portals (React + Vite).
- Mobile app: Candidate progress, notifications, interview agenda (React Native + Expo).

Server layer:
- API server: Express REST API.
- Realtime server: Socket.IO namespaces for interviews and collaboration.
- AI worker: Node service queue consumer for asynchronous feedback generation.

Data layer:
- MongoDB Atlas for application data.
- Redis for caching, presence, and socket scaling metadata.
- Object storage (optional) for resume files and exports.

## 4) Repositories Strategy
Two repositories:
- Backend repo: skillgate-backend
- Frontend repo: skillgate-frontend

Frontend repo contains both web and mobile apps to preserve assignment requirement of one frontend repo while delivering both platforms.

Proposed frontend structure:
- docs/
- apps/web/
- apps/mobile/
- packages/shared/

## 5) Core User Roles
- Candidate: applies, solves assessments, receives feedback, schedules interview slots.
- Recruiter: creates jobs, assigns assessments, reviews analytics, schedules interviews.
- Admin (optional): manages users, plans, system config.

## 6) Feature Set
MVP:
- Authentication with role-based access.
- Candidate portal and recruiter dashboard.
- Coding challenge runner with timed assessments.
- Automatic grading for objective test cases.
- Interview scheduling with reminders.
- Real-time collaborative coding session.
- AI-generated feedback for submissions.
- Analytics dashboard.

High-value extensions:
- Anti-cheat signals (tab switching, suspicious paste bursts).
- Skill graph per candidate over time.
- Interview kit templates per job family.
- Candidate-friendly AI hints with strict attempt limits.

## 7) Data Model (MongoDB Collections)
- users: identity, role, profile, auth metadata.
- companies: recruiter organizations.
- jobs: role requirements and status.
- applications: candidate-to-job records and stage progression.
- challenges: coding questions with test suites.
- assessments: assembled challenge sets with timer config.
- submissions: code answers, runtime results, grading output.
- interviews: schedule details, participants, room metadata.
- interviewSessions: realtime collaborative session state snapshots.
- feedbackReports: AI + rubric outcomes and explanations.
- notifications: reminders and in-app alerts.
- auditLogs: compliance and action tracing.

## 8) API Boundaries
Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh

Candidate:
- GET /candidate/me
- GET /candidate/assessments
- POST /candidate/submissions
- GET /candidate/feedback/:submissionId

Recruiter:
- POST /recruiter/jobs
- GET /recruiter/applications
- POST /recruiter/assessments/assign
- POST /recruiter/interviews/schedule
- GET /recruiter/analytics

Realtime:
- Socket namespace /collab for editor sync.
- Socket namespace /interview for interview room events.

## 9) Realtime Event Design
Collaborative editor events:
- room:join
- room:leave
- code:change
- cursor:move
- run:request
- run:result

Interview events:
- interview:ready
- interview:presence
- interview:note
- interview:end

## 10) State Management Design
Frontend state split:
- Server state: RTK Query (auth session, jobs, assessments, submissions, analytics).
- UI state: Redux slices (editor state, timers, panel visibility, notifications).
- Realtime state: websocket reducers/event handlers append incremental updates.

Why this matters:
- Predictable state transitions for complex interview flows.
- Cache invalidation rules for performance and correctness.
- Easy debugging using Redux DevTools.

## 11) Security Model
- JWT access + refresh token strategy.
- Role-based authorization middleware for candidate/recruiter/admin.
- Request validation with schema validators.
- Rate limiting for auth and AI endpoints.
- Helmet, CORS allowlist, sanitized inputs.
- Secrets in env vars only.
- Audit logs for privileged recruiter/admin actions.

## 12) AI Integration Design
AI services used for:
- Submission feedback explanation.
- Rubric-based scoring assistance.
- Recruiter summary briefs for candidate comparisons.

Safety and quality controls:
- Prompt templates with rubric constraints.
- Store prompt version and model metadata in feedbackReports.
- Human override for final hiring decisions.

## 13) Testing Plan
- Unit tests: grading utilities, permission checks, reducers.
- Integration tests: auth flow, submission flow, scheduling flow.
- Realtime tests: socket room join/leave and event propagation.
- E2E tests (web): candidate takes assessment and recruiter reviews result.

## 14) Deployment Plan
- Backend: Render/Fly/Railway.
- Frontend web: Vercel/Netlify.
- Mobile: Expo EAS build and publish.
- Database: MongoDB Atlas.

## 15) Portfolio Positioning
To maximize hiring impact:
- Show architecture decisions in README diagrams.
- Add demo accounts and guided demo script.
- Include measurable quality indicators (test coverage, Lighthouse score, API latency budget).
