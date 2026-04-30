# Installation & Setup Guide

## What's Fixed

✅ **No login page** - goes straight to dashboard  
✅ **No auth routes** - removed completely  
✅ **Locks in database** - persistent and secure  
✅ **Admin endpoints** - view all locks  

---

## Installation

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### 2. Environment Variables

Create `.env` file in `/backend` directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/studsave

# JWT (optional, not used in frontend)
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (for potential future use)
CLIENT_URL=http://localhost:3000
```

---

### 3. Start the Application

**Development Mode:**

Terminal 1 - Backend:
```bash
cd backend
npm start
```
Backend runs on: `http://localhost:5000`

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:3000`

**Production Mode:**

```bash
cd backend
npm install
npm start

# Frontend is served from backend/public (built automatically)
# Visit http://localhost:5000
```

---

## Folder Structure

```
studsave/
├── backend/
│   ├── models/
│   │   ├── Academic.js       (Year/Grade)
│   │   ├── Semester.js       (Term)
│   │   ├── Subject.js        (Folder - with lock fields)
│   │   ├── Unit.js           (Notes/Content)
│   │   ├── User.js           (Not used in single-user)
│   │   └── ...
│   ├── routes/
│   │   ├── academics.js      (CRUD Academic)
│   │   ├── semesters.js      (CRUD Semester)
│   │   ├── subjects.js       (CRUD Subject + Lock)
│   │   ├── units.js          (CRUD Unit)
│   │   ├── search.js         (Search)
│   │   ├── admin.js          (NEW - View all locks)
│   │   └── auth.js           (DELETED)
│   ├── middleware/
│   │   └── auth.js           (Single-user middleware)
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       (Navigation & lock controls)
│   │   │   ├── MainContent.tsx   (Content viewer)
│   │   │   ├── UnitEditor.tsx    (Text editor)
│   │   │   └── Modal.tsx         (Dialogs)
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx (Main page)
│   │   ├── context/
│   │   │   └── AppContext.tsx    (State management)
│   │   ├── utils/
│   │   │   ├── api.ts           (API calls)
│   │   │   └── types.ts         (TypeScript types)
│   │   └── App.tsx
│   └── package.json
│
├── FIXES.md            (What was fixed)
├── ADMIN_GUIDE.md      (How to use admin endpoints)
├── INSTALLATION.md     (This file)
└── README.md           (Original readme)
```

---

## Database Collections

### Subject Collection (With Locks)
```json
{
  "_id": ObjectId,
  "name": "Math Notes",
  "semesterId": ObjectId,
  "academicId": ObjectId,
  "userId": ObjectId,
  "isLocked": true,
  "pinHash": "$2b$10$...",
  "icon": "📚",
  "color": "#2d6a4f",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Hierarchy
```
Academic (Year/Grade)
└── Semester (Term)
    └── Subject (Folder)
        └── Unit (Notes/Content)
```

---

## API Endpoints

### Academics
- `GET /api/academics` - List all academic years
- `POST /api/academics` - Create academic year
- `PUT /api/academics/:id` - Update academic year
- `DELETE /api/academics/:id` - Delete academic year (cascade)

### Semesters
- `GET /api/semesters/academic/:academicId` - List semesters
- `POST /api/semesters` - Create semester
- `PUT /api/semesters/:id` - Update semester
- `DELETE /api/semesters/:id` - Delete semester (cascade)

### Subjects (Folders with Locks)
- `GET /api/subjects/semester/:semesterId` - List subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `PUT /api/subjects/:id/lock` - Set/update lock PIN
- `POST /api/subjects/:id/verify-lock` - Verify PIN
- `DELETE /api/subjects/:id/lock` - Remove lock
- `DELETE /api/subjects/:id` - Delete subject

### Units (Content)
- `GET /api/units/subject/:subjectId` - List units
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Search
- `GET /api/search?q=query` - Search across all items

### Admin (NEW)
- `GET /api/admin/locks` - View all locked folders
- `GET /api/admin/all-subjects` - View all folders with lock status

---

## Workflow

### User Workflow
1. **Open app** → Goes to dashboard (no login)
2. **Create Academic Year** → Click "+" next to "Years"
3. **Create Semester** → Expand year → Click "+" next to semester name
4. **Create Subject (Folder)** → Expand semester → Click "+" next to subjects
5. **Lock Folder** → Click lock icon on subject → Enter PIN → Save
6. **Create Notes** → Click "+" next to subject → Add units (notes)
7. **Unlock Folder** → Click lock icon on subject → Enter PIN → Verify

### Admin Workflow
1. **Check all locks:**
   ```bash
   curl http://localhost:5000/api/admin/locks
   ```

2. **Check all folders:**
   ```bash
   curl http://localhost:5000/api/admin/all-subjects
   ```

3. **Monitor locked items** by academic year and semester

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### MongoDB connection fails
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas
- Check IP whitelist settings

### Frontend doesn't load
```bash
# Clear cache and rebuild
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

### Lock endpoints not working
- Ensure backend is running
- Check that Subject model has `isLocked` and `pinHash` fields
- Verify `/api/admin/locks` returns data

---

## Production Deployment

### Option 1: Render.com (Already Configured)
Uses `render.yaml` - deploy directly

### Option 2: Heroku
```bash
git init
git add .
git commit -m "initial"
heroku create your-app-name
git push heroku main
```

### Option 3: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Build frontend
COPY frontend ./frontend
WORKDIR ./frontend
RUN npm install && npm run build

# Setup backend
WORKDIR /app
COPY backend ./backend
WORKDIR ./backend
RUN npm install

EXPOSE 5000
CMD ["node", "server.js"]
```

---

## Testing Admin Endpoints

Use Postman, Insomnia, or curl:

**Get all locks:**
```bash
curl -X GET http://localhost:5000/api/admin/locks | jq .
```

**Get all subjects grouped:**
```bash
curl -X GET http://localhost:5000/api/admin/all-subjects | jq .
```

---

## Key Files to Review

1. **`/backend/routes/admin.js`** - New admin endpoints (see lock data)
2. **`/backend/models/Subject.js`** - Lock fields (`isLocked`, `pinHash`)
3. **`/backend/middleware/auth.js`** - Single-user setup
4. **`/frontend/src/components/Sidebar.tsx`** - Lock UI controls
5. **`FIXES.md`** - Summary of all changes

---

## No More Login!

✅ App loads directly to dashboard  
✅ No register page  
✅ No login form  
✅ Single-user setup  
✅ All data persists in database  

Happy studying! 📚
