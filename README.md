# Recyclo: AI-Powered Waste-to-Resource & Upcycling Marketplace

Recyclo is a mobile-responsive Progressive Web Application (PWA) and conversational platform connecting waste generators (households) with scrap collectors and upcyclers.

---

## 🏗️ Architecture & Component Topology

```
┌────────────────────────────────────────────────────────┐
│                   NEXT.JS (CLIENT)                     │
│  - HTML5 Camera Scanner (MediaDevices API)             │
│  - Decision Engine: Restore (YouTube/Supplies) vs Sell │
│  - Voice Agent Interface (Audio Recording & Playback)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST / Multipart / Audio Stream
┌───────────────────────────▼────────────────────────────┐
│              EXPRESS SERVER (RENDER.COM)               │
│  - Ephemeral Memory Buffer Multer Processing           │
│  - Direct Storage Pipe to Supabase Storage             │
│  - Whisper Speech-to-Text Integration                  │
│  - Gemini Multimodal Vision & Agentic Reasoning        │
│  - ElevenLabs Voice Synthesis Audio Stream             │
│  - YouTube Data API v3 Tutorial Search                 │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│     SUPABASE (POSTGRESQL)   │ │    THIRD-PARTY APIS    │
│  - Users & Green Points     │ │  - Google Gemini API   │
│  - Marketplace Listings     │ │  - ElevenLabs TTS      │
│  - Restoration Products     │ │  - OpenAI Whisper      │
│  - Transaction History      │ │  - YouTube Data API v3 │
│  - Row Level Security (RLS) │ └────────────────────────┘
│  - 'item-images' Bucket     │
└─────────────────────────────┘
```

---

## 🗄️ Database Schema & RLS Setup

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the provided script: [`schema.sql`](file:///Users/meta/Desktop/recyclo/schema.sql).
3. The script configures:
   - `users` table with automatic sync from `auth.users` via trigger.
   - `marketplace_listings` with status tracking (`available`, `pending_pickup`, `sold`).
   - `restoration_products` catalog for cross-selling tools, sandpaper, varnish, etc.
   - `transaction_history` with automated **Green Points** allocation trigger.
   - Granular **Row Level Security (RLS)** policies for both waste generators and collectors.
   - Public Supabase Storage bucket `item-images`.

---

## 🚀 Running the Project Locally

### 1. Backend Service (Express + AI Integrations)
```bash
cd server
npm install
cp ../.env.example .env # Fill in your API keys
npm run dev
```
Health check is available at: `http://localhost:5000/health`.

### 2. Frontend Application (Next.js)
```bash
cd client
npm install
npm run dev
```

---

## ☁️ Deployment on Render (24/7 Web Service)

1. Connect your repository to **Render.com**.
2. Create a new **Web Service**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: Paid Starter Tier ($7/mo) to eliminate cold starts for audio streaming.
   - **Health Check Path**: `/health`
3. Add the environment variables specified in [`.env.example`](file:///Users/meta/Desktop/recyclo/.env.example).
