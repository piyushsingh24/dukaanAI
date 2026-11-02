# DukaanAI

AI-powered WhatsApp commerce platform for merchants. Backend (Node.js + Express + Prisma + Socket.IO) and frontend (Next.js 14).

## Project structure

```
dukaanAI/
├── backend/      # Express API, Prisma, WhatsApp (Baileys), AI pipeline
├── frontend/     # Next.js merchant dashboard
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- MySQL 8+
- npm

## Local development

### Backend

```bash
cd backend
cp .env.example .env
# edit .env with your database and API keys
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs on http://localhost:4000.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs on http://localhost:3000.

## Environment variables

### backend/.env

| Variable | Description |
|---|---|
| PORT | Server port (default 4000) |
| DATABASE_URL | MySQL connection string |
| JWT_SECRET | JWT signing secret |
| JWT_EXPIRES_IN | Token expiry (default 7d) |
| CORS_ORIGIN | Comma-separated allowed origins |
| NODE_ENV | development/production |
| GROQ_API_KEY | Groq API key for AI |
| GROQ_MODEL | Groq model name |

### frontend/.env.local

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend API base URL |
| NEXT_PUBLIC_SOCKET_URL | Backend Socket.IO URL |

## Deployment

### Docker Compose

```bash
cp backend/.env.example backend/.env
# fill in secrets
docker compose up --build
```

Services: MySQL (3306), backend (4000), frontend (3000).

### Manual / PaaS

Backend build & start:
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm ci
npm run build
npm start
```

Set environment variables on the host accordingly. Update `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` to the deployed backend URL before building the frontend.

## Scripts

Backend: `dev`, `build`, `start`, `prisma:generate`, `prisma:migrate`, `prisma:seed`, `prisma:deploy`
Frontend: `dev`, `build`, `start`, `lint`
