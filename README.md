# CodeScan AI 🔍
### AI-Powered Code Reviewer + Full DevOps Pipeline

> Groq AI · Node.js · MongoDB · Docker · GitHub Actions · Vercel

---

## ⚡ What You Get

| Feature | Description |
|---|---|
| AI Code Review | Groq LLM detects bugs, Big-O complexity, optimized code |
| 13 Languages | Java, Python, JS, TS, C++, Go, Rust, Kotlin, Swift, PHP, Ruby, C |
| MongoDB | Persistent review history with full CRUD |
| Docker | Multi-stage production image + dev hot-reload |
| CI/CD | 6-job GitHub Actions pipeline (test → scan → build → deploy) |
| Vercel | Frontend static + serverless API functions |
| DevOps Dashboard | Visual pipeline status page built into the app |

---

## 🗂 Project Structure

```
codescan-ai/
├── public/                    ← Frontend (served as static files)
│   ├── index.html             ← Main app
│   ├── script.js              ← All frontend logic
│   ├── style.css              ← Styles
│   ├── config.js              ← ⚠️ PUT YOUR GROQ KEY HERE
│   └── devops.html            ← DevOps pipeline dashboard
│
├── api/                       ← Vercel serverless functions
│   ├── reviews.js             ← GET/POST/DELETE /api/reviews
│   ├── reviews/[id].js        ← GET/DELETE /api/reviews/:id
│   ├── stats.js               ← GET /api/stats
│   └── health.js              ← GET /health
│
├── scripts/
│   └── mongo-init.js          ← Docker MongoDB init + indexes
│
├── .github/workflows/
│   ├── ci-cd.yml              ← Main CI/CD pipeline
│   └── docker-scan.yml        ← Weekly security scan
│
├── server.js                  ← Express server (for local/Docker)
├── Dockerfile                 ← Multi-stage production build
├── docker-compose.yml         ← Production stack
├── docker-compose.override.yml← Dev hot-reload override
├── vercel.json                ← Vercel routing + security headers
├── package.json
├── .env.example               ← Copy to .env
└── .gitignore
```

---

# 🚀 HOW TO RUN — 3 OPTIONS

---

## OPTION 1 — Simplest: Node.js only (no Docker)

### Prerequisites
- Node.js 18+ → https://nodejs.org
- MongoDB → either install locally or use free Atlas cloud

### Step 1 — Install Node.js
Download from https://nodejs.org and install.
Verify: open terminal and run `node -v` (should show v18+)

### Step 2 — Get a FREE Groq API Key
1. Go to https://console.groq.com
2. Sign up (free, no credit card)
3. Go to API Keys → Create API Key
4. Copy the key (starts with `gsk_...`)

### Step 3 — Get MongoDB
**Option A — Local install:**
- Download from https://www.mongodb.com/try/download/community
- Install and start: `mongod --dbpath /data/db`

**Option B — Free cloud (recommended for beginners):**
1. Go to https://cloud.mongodb.com
2. Sign up → Create free cluster (M0, 512MB free)
3. Create user: Database Access → Add User
4. Allow connections: Network Access → Add IP → 0.0.0.0/0
5. Get URI: Clusters → Connect → Drivers → copy the URI
   Looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codescan`

### Step 4 — Clone / Extract the project
```bash
# If you have git:
git clone <your-repo-url>
cd codescan-ai

# Or just extract the ZIP you downloaded
cd codescan-ai
```

### Step 5 — Install dependencies
```bash
npm install
```

### Step 6 — Configure environment
```bash
# Copy the example file
cp .env.example .env
```

Now open `.env` in any text editor and fill it in:
```
MONGO_URI=mongodb://localhost:27017/codescan   # or your Atlas URI
PORT=3000
NODE_ENV=development
```

### Step 7 — Set your Groq API key
Open `public/config.js` in a text editor and paste your key:
```javascript
GROQ_API_KEY: "gsk_your_actual_key_here",
```

### Step 8 — Start the server
```bash
# Development (auto-restart on changes):
npm run dev

# Or production:
npm start
```

### Step 9 — Open the app
Open your browser: **http://localhost:3000**

That's it! Paste code and click "Run Review".

---

## OPTION 2 — Docker (everything in containers, zero local setup)

### Prerequisites
- Docker Desktop → https://www.docker.com/products/docker-desktop
  Install and make sure it's running (whale icon in taskbar)

### Step 1 — Get your Groq API key
Same as Option 1 Step 2 above.

### Step 2 — Configure
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://mongo:27017/codescan   ← use THIS for Docker
PORT=3000
NODE_ENV=production
```

Edit `public/config.js`:
```javascript
GROQ_API_KEY: "gsk_your_actual_key_here",
```

### Step 3 — Build and start
```bash
# Build image and start all containers:
docker compose up -d

# Watch logs:
docker compose logs -f app
```

Wait for `✅ MongoDB connected` in the logs.

### Step 4 — Open the app
**http://localhost:3000**

### Useful Docker commands
```bash
# Stop everything
docker compose down

# Stop AND delete data
docker compose down -v

# Restart just the app
docker compose restart app

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build
```

### Dev mode with hot reload
```bash
# The override file is auto-loaded in dev:
docker compose up
# Now edit files and the server restarts automatically
```

---

## OPTION 3 — Deploy to Vercel (live on the internet)

### Prerequisites
- GitHub account
- Vercel account → https://vercel.com (free)
- MongoDB Atlas URI (see Option 1, Step 3B)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/codescan-ai.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to https://vercel.com → New Project
2. Import your GitHub repository
3. Framework: **Other** (leave default)
4. Root Directory: leave empty
5. Click **Deploy**

### Step 3 — Add environment variable
In Vercel dashboard → Your project → Settings → Environment Variables:
```
Name:  MONGO_URI
Value: mongodb+srv://user:pass@cluster.mongodb.net/codescan
```
Click Save, then **Redeploy**.

### Step 4 — Update config.js for production
In `public/config.js`, change the BACKEND_URL to your Vercel URL:
```javascript
BACKEND_URL: "https://your-app.vercel.app/api"
```
Push the change — Vercel auto-deploys.

---

## ⚙️ CI/CD Pipeline Setup (GitHub Actions)

Once your code is on GitHub, set up automatic deployments:

### Required GitHub Secrets
Go to: GitHub repo → Settings → Secrets and Variables → Actions → New secret

| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Team Settings → General (Team ID) |
| `VERCEL_PROJECT_ID` | Run `vercel link` locally → check `.vercel/project.json` |

### How it works after setup
Every `git push` to `main`:
1. ✅ Runs lint + tests
2. ✅ Audits npm packages for vulnerabilities
3. ✅ Builds Docker image, pushes to GitHub Container Registry
4. ✅ Deploys to Vercel production
5. ✅ Sends Slack notification (if `SLACK_WEBHOOK_URL` set)

Every Pull Request:
- ✅ Gets a unique preview URL auto-posted as a PR comment

---

## 🔑 All Configuration Options

### public/config.js (frontend)
```javascript
GROQ_API_KEY: "gsk_...",          // Your Groq key (required)
GROQ_MODEL:   "llama-3.3-70b-versatile",  // or llama3-8b-8192 for speed
GROQ_URL:     "https://api.groq.com/openai/v1/chat/completions",
BACKEND_URL:  "http://localhost:3000/api"  // change for production
```

### .env (backend)
```
MONGO_URI=mongodb://localhost:27017/codescan
PORT=3000
NODE_ENV=development
```

---

## 🔌 API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | /health | Server + DB status |
| POST | /api/reviews | Save a review |
| GET | /api/reviews | List all (max 50) |
| GET | /api/reviews/:id | Get one |
| DELETE | /api/reviews/:id | Delete one |
| DELETE | /api/reviews | Delete all |
| GET | /api/stats | Aggregated stats |

---

## ❓ Troubleshooting

**"API Key Missing" error**
→ Open `public/config.js` and paste your Groq key

**"Cannot connect to backend" in DB tab**
→ Make sure `node server.js` or `docker compose up` is running

**MongoDB connection error**
→ Check your MONGO_URI in `.env`
→ For Atlas: check IP whitelist allows 0.0.0.0/0

**Docker: port already in use**
→ `docker compose down` then `docker compose up -d`
→ Or change PORT in `.env`

**Vercel: API routes 404**
→ Make sure `vercel.json` is in root
→ Check your BACKEND_URL in config.js points to your Vercel domain

---

## 📄 License
MIT — use freely, modify, deploy anywhere.
