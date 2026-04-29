# StudyNest 📚

Academic study platform — organise Academics → Semesters → Subjects → Units with rich block-based notes (text, code, images).

## Project Structure

```
studynest/
├── backend/          ← Node.js + Express API
│   ├── config/       ← Passport (JWT + Google OAuth)
│   ├── middleware/   ← JWT auth middleware
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← REST API routes
│   ├── server.js     ← Entry point (serves frontend in production)
│   ├── .env          ← YOUR secrets (never commit this)
│   └── .env.example  ← Template to copy from
├── frontend/         ← React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   └── dist/         ← Built output (auto-generated, not committed)
├── render.yaml       ← Render deployment config
└── .gitignore
```

## Run Locally

### 1. Setup backend environment
```bash
cd backend
cp .env.example .env
# Edit .env — fill in MONGODB_URI and JWT_SECRET
```

### 2. Install & start backend
```bash
cd backend
npm install
npm run dev
# ✅ Running on http://localhost:5000
```

### 3. Install & start frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# ✅ Running on http://localhost:5173
```

Open **http://localhost:5173** — Vite proxies all `/api` calls to `:5000` automatically.

## Deploy to Render

1. Push this folder to a GitHub repository
2. Go to https://render.com → New → Web Service
3. Connect the repo
4. Set these in Render dashboard → Environment:
   - `MONGODB_URI` = your Atlas connection string
   - `NODE_ENV` = production
   - `JWT_SECRET` = any long random string
5. Build command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
6. Start command: `NODE_ENV=production node backend/server.js`

That's it — Render builds the frontend and the backend serves it.
