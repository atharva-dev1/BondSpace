<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-ff69b4?style=for-the-badge&logo=github" alt="version"/>
<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
<img src="https://img.shields.io/badge/Capacitor-6-1E88E5?style=for-the-badge&logo=capacitor" alt="Capacitor"/>
<img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js"/>
<img src="https://img.shields.io/badge/PostgreSQL-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Socket.IO-realtime-010101?style=for-the-badge&logo=socket.io" alt="Socket.IO"/>
<img src="https://img.shields.io/badge/libsodium-E2E_Encryption-red?style=for-the-badge&logo=lock" alt="Encryption"/>

# 💖 BondSpace — *The Infinite Love Ecosystem*

> **BondSpace** is the ultimate, end-to-end encrypted relationship super-app. It’s an expansive digital universe designed for couples and close friends to connect, communicate, play, and grow together without compromising privacy. 

[**✨ Download Native Android APK**](https://ashwinjauhary.github.io/BondSpace-Release/docs/) · [**📖 Explore Architecture**](#%EF%B8%8F-core-architecture--system-design) · [**🐛 Report Bug**](../../issues)

---
</div>

## 📑 Table of Contents

1. [🌌 Core Philosophy & Vision](#-core-philosophy--vision)
2. [✨ Infinite Features Matrix](#-infinite-features-matrix)
3. [🏗️ Core Architecture & System Design](#%EF%B8%8F-core-architecture--system-design)
4. [📱 The Native Mobile & OTA Ecosystem](#-the-native-mobile--ota-ecosystem)
5. [🔐 Security, E2E Encryption & Storage Plan](#-security-e2e-encryption--storage-plan)
6. [🔌 Comprehensive API Reference](#-comprehensive-api-reference)
7. [⚡ Real-Time Socket.IO Protocol](#-real-time-socketio-protocol)
8. [🗄️ Database Schema & Entity Relationships](#%EF%B8%8F-database-schema--entity-relationships)
9. [🛠️ Tech Stack Breakdown](#-tech-stack-breakdown)
10. [🚀 Zero-to-Hero Deployment Guide](#-zero-to-hero-deployment-guide)
11. [💼 Developer & Project Structure](#-developer--project-structure)

---

## 🌌 Core Philosophy & Vision

BondSpace was built on three foundational pillars:
1. **Absolute Privacy:** Your relationship data is yours. Using **libsodium (NaCl)**, all direct messages are encrypted client-side. The server only sees ciphertext.
2. **Living Gamification:** Relationships thrive on positive reinforcement. Integrated RPG-like mechanics (Love XP, leveling, unlocking stickers, winning game streaks) keep the spark alive.
3. **Seamless Accessibility (OTA):** Users shouldn't deal with App Store updates. Via **Capacitor + GitHub Releases**, the mobile app updates its internal web bundle quietly in the background.

---

## ✨ Infinite Features Matrix

BondSpace is designed to replace multiple apps (WhatsApp for chat, Life360 for location, mobile games for fun, Google Photos for memories) into one unified safe space.

### 1. 💬 Secure Chat Engine
- **Client-Side E2E Encryption:** Messages are encrypted using `crypto_secretbox_easy`. Keys are derived via X25519 DH Key Exchange upon couple paring.
- **Disappearing Messages:** Configure self-destruct timers (View Once, 1 hr, 24 hr) verified and pruned by the server backend cron jobs.
- **Rich Media & Voice:** Cloudinary handles media (with blurred placeholders). Voice notes are recorded as base64 buffered chunks.
- **Threaded Replies & Reactions:** PostgreSQL JSONB columns store metadata for deep reactions and reply-chain IDs.

### 2. 📍 Advanced Live Location & Consent
- **Real-Time Tracking:** Sub-second GPS polling via HTML5 Geolocation API pushing to `Socket.IO`. 
- **Leaflet Mapping:** Renders dynamic map UI with custom markers for the user and partner.
- **Privacy First (Mutual Consent):** Both partners must digitally "sign" to share location. Features 'Reached Home' polygons (Geofencing).
- **Battery & Diagnostics:** Location packets include battery percentage to avoid "you ignored me" conflicts when phones die.

### 3. 🎮 Game Engine (20 Integrated Games)
Built on a centralized Socket.IO game dispatcher. Games range from synchronous to asynchronous.

| Supported Games | Type | State Management |
|---|---|---|
| **Who Knows Me Better** | Real-time Quiz | Redis Pub/Sub |
| **Truth or Dare** | Turn-based | PostgreSQL |
| **Love Bingo** | Board / Matching | Redis |
| **Rapid Questions** | Speed Quiz | Redis Pub/Sub |
| **Story Builder** | Collaborative Text | PostgreSQL JSONB |
| *+ 15 additional mini-games* | Multi-genre | Hybrid |

### 4. 🤖 Love Guru & Date Planner
An integrated LLM-powered context bot.
- **Relationship Advice:** Analyzes recent chat length, sentiment (locally implied), and provides non-biased mediation.
- **AI Date Planner:** Inputs budget, location, and previous activities to spit out structured, multi-step date itineraries.

### 5. 🏆 RPG Gamification & The Arena
- **Love XP Engine:** Every action (sending a daily morning text, winning a game, reaching 100 days streak) yields XP.
- **Levels & Tiers:** Bronze, Silver, Gold, Platinum, Diamond bond tiers.
- **Love Arena Store:** Users spend XP to unlock:
  - Custom UI color themes for the app (persisted in Zustand).
  - Premium Sticker packs for chat.
  - Avatar borders and profile badges.

### 6. 💌 Digital Love Letters
- Time-locked cryptography. Users write letters sealed until a specific timestamp (e.g., Anniversary midnight). A Node-Cron worker unlocks and triggers notifications via Socket.IO exactly at that millisecond.

### 7. 🌳 The Bond Tree
- A visual timeline UI. As users upload milestones (First Date, First Kiss, Engagement), the tree SVG scales and branches out dynamically.

### 8. 🌍 Anonymous Community Spaces
- Secure sandbox rooms where users can join anonymously (e.g., "Marriage Advice Room") without exposing their couple identity.

---

## 🏗️ Core Architecture & System Design

BondSpace employs a decoupled client-server topography, utilizing a monorepo structure.

```mermaid
graph TD;
    Client[Next.js PWA / Capacitor Android App] <-->|HTTPS REST| API[Express.js 5 API];
    Client <-->|WSS Socket.IO| Socket[Real-Time Engine];
    
    API --> DB[(PostgreSQL 14)];
    Socket --> Redis[(Redis 7 Pub/Sub)];
    API --> Redis;
    
    API <-->|Media Uploads| CDN[Cloudinary CDN];
    API <-->|LLM Queries| AI[Love Guru Inference];
    
    GitHub[GitHub Actions] -->|Compiles Web| ZIP[Release Bundle];
    GitHub -->|Builds| APK[Capacitor APK];
    Client -->|OTA Update Check| ZIP;
```

---

## 📱 The Native Mobile & OTA Ecosystem

The native Android app is built using **Capacitor 6**, treating the Next.js `out/` export folder as the native WebView content.

### The Over-The-Air (OTA) Bootstrapper Flow:
Instead of forcing users to update via the Play Store for every UI change, BondSpace updates itself:
1. **GitHub Release Check:** On launch, `<OTABootstrap />` pings the GitHub API for the `latest-bundle` tag of `bondspace-release`.
2. **Version Comparison:** If the remote bundle timestamp > local bundle timestamp, the OTA process begins.
3. **Background Download:** `capacitor-plugin-file-download` pulls the `bundle.zip` directly to the device's internal storage.
4. **Extraction & Hot Swap:** `capacitor-plugin-zip` unzips the payload, overwrites the WebView serving directory, and triggers a seamless `window.location.reload()`.

---

## 🔐 Security, E2E Encryption & Storage Plan

BondSpace guarantees privacy via mathematical encryption, not just policy.

### Message Encryption Flow
```mermaid
sequenceDiagram
    participant Alice
    participant Server
    participant Bob
    Alice->>Alice: Generate Ed25519 Keypair
    Bob->>Bob: Generate Ed25519 Keypair
    Alice->>Server: Upload Public Key
    Bob->>Server: Upload Public Key
    Alice->>Server: Fetch Bob's Public Key
    Alice->>Alice: Compute Shared AES-256-GCM Secret (libsodium)
    Alice->>Alice: Encrypt Message ("Hello") -> Ciphertext
    Alice->>Server: Send Ciphertext
    Server->>Bob: Deliver Ciphertext
    Bob->>Bob: Decrypt using Shared Secret -> "Hello"
```
**Important:** The server NEVER holds the private keys. Database breaches yield zero plaintext messages.

---

## 🔌 Comprehensive API Reference

Base URL: `/api/v1/`

### 🛡️ Authentication & User `[GET/POST /auth]`
- `POST /auth/register` - Create user profile & generate initial keypair block.
- `POST /auth/login` - Authenticate via bcrypt and return HTTP-only JWT cookie.
- `GET /auth/me` - Validate active session.

### ❤️ Couple Bonding `[POST /bond]`
- `POST /bond/invite` - Generate a unique 6-digit OTP/URL for partner to join.
- `POST /bond/accept` - Validate OTP and link user IDs in `couples` table.
- `DELETE /bond/breakup` - Soft delete couple connection & quarantine data.

### 💬 Messaging `[GET/POST /messages]`
- `POST /messages/send` - Accepts Payload: `{ senderId, coupleId, ciphertext, nonce, mediaUrl }`.
- `GET /messages/sync` - Returns all messages > last sync timestamp.

### 🎮 Games `[GET/POST /games]`
- `GET /games/library` - Retrieve all 20 game templates.
- `POST /games/start` - Initialize a Redis session for a real-time game.
- `POST /games/submit-move` - Submit a player's choice/answer in active JSON state.

### 🛒 Gamification & Store `[GET/POST /store]`
- `GET /store/inventory` - Fetch purchasable items (Themes, Stickers).
- `POST /store/purchase` - Deduct Love XP and append item to `user_unlockables`.

---

## ⚡ Real-Time Socket.IO Protocol

| Event Channel | Payload Example | Description |
|---|---|---|
| `auth:join_room` | `{ coupleId: 'uuid' }` | Subscribes client to private couple room. |
| `chat:typing` | `{ isTyping: true, user: 'A' }` | Triggers UI typing indicator on partner side. |
| `chat:message` | `{ id: 'uuid', text: 'cipher...', ... }` | Emits encrypted payload instantly. |
| `loc:update` | `{ lat: 26.44, lng: 80.33, batt: 84 }` | Broadcasts live GPS via Leaflet. |
| `game:state_change` | `{ gameId: 'uuid', turn: 'B', ...}` | Dispatches updated complete board/quiz state. |
| `call:offer` | `{ sdp: '...', type: 'offer' }` | WebRTC signaling for future voice/video integration. |

---

## 🗄️ Database Schema & Entity Relationships

The PostgreSQL database encompasses 20 core tables strictly relational and normalized.

### 1. Core Users & Couples
- `users`: `id (UUID)`, `email`, `password_hash`, `public_key`, `created_at`.
- `couples`: `id (UUID)`, `partner1_id (FK)`, `partner2_id (FK)`, `bond_level (INT)`, `xp (INT)`, `anniversary_date (DATE)`.

### 2. Deep Metrics
- `health_scores`: Periodically calculated. `id`, `couple_id`, `communication_score`, `activity_score`, `trust_score`, `computed_at`.
- `location_logs`: `id`, `user_id`, `lat`, `lng`, `battery`, `timestamp`.

### 3. Messaging & Media
- `messages`: `id`, `couple_id`, `sender_id`, `ciphertext`, `nonce`, `type` (TEXT/MEDIA), `is_pinned`, `expires_at`.
- `gallery_albums`: `id`, `couple_id`, `title`, `cover_image_url`, `theme`.
- `gallery_media`: `id`, `album_id`, `url`, `type`, `uploaded_by`, `caption`.

### 4. Gaming & Gamification
- `game_sessions`: `id`, `couple_id`, `game_type`, `state (JSONB)`, `status` (ACTIVE/FINISHED), `winner_id`.
- `unlockables`: `id`, `type` (THEME/STICKER/FRAME), `name`, `xp_cost`, `asset_url`.
- `user_unlockables`: `user_id (FK)`, `unlockable_id (FK)`, `purchased_at`.

---

## 🛠️ Tech Stack Breakdown

### Frontend — Dynamic Client & Mobile
- **Next.js 16 (React 19)**: Leveraging App Router, Server Actions, and optimal chunking. 
- **Capacitor 6**: Maps native mobile APIs (Bluetooth, File System, Geolocation) securely into the DOM.
- **Tailwind CSS v4 & Framer Motion**: Liquid smooth animations, dynamic dark mode, glassmorphism UI.
- **Zustand**: Slices state into `authStore`, `chatStore`, `gameStore`, `themeStore`.

### Backend — High Performance API
- **Node.js 18 & Express 5**: Asynchronous routing, middleware arrays, structured error handling.
- **Socket.IO**: Fallback polling to WebSocket upgrade, stateful connections via Redis Adapter.
- **PostgreSQL (pg)**: Robust parameterized queries to prevent SQL injection.
- **Cloudinary SDK**: Direct stream uploads limiting server RAM buffering.

---

## 🚀 Zero-to-Hero Deployment Guide

From zero to a fully deployed environment globally.

### Step 1: Clone & Install Submodules
```bash
git clone --recurse-submodules https://github.com/Ashwinjauhary/bondspace.git
cd bondspace
npm run install:all
```

### Step 2: Environment Variables Preparation
**Backend (`backend/.env`)**
```env
PORT=5005
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/bondspace
REDIS_URL=redis://default:pass@redis-host:6379
JWT_SECRET=super_secure_key_512bit_random
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=https://bondspace-backend.render.com
NEXT_PUBLIC_SOCKET_URL=https://bondspace-backend.render.com
NEXT_PUBLIC_OTA_RELEASE_URL=https://api.github.com/repos/Ashwinjauhary/BondSpace-Release/releases/tags/latest-bundle
```

### Step 3: Database Migration
```bash
# Apply schemas
cd backend
psql $DATABASE_URL -f src/db/schema.sql
# Insert default system gamification templates
psql $DATABASE_URL -f src/db/seed.sql
```

### Step 4: Start Production Server
```bash
# Build the Next.js bundle
cd ../frontend
npm run build

# Start the Node Backend
cd ../backend
npm start
```

### Step 5: Android Build (Releasing)
```bash
cd frontend
export MOBILE_BUILD=true
npm run build
npx cap sync android
# Open Android Studio to sign the release bundle
npx cap open android
```

---

## 💼 Developer & Project Structure

**Lead Developer:** Ashwin Jauhary — Full Stack Developer | BCA Student  
**Contact:** ashwin2431333@gmail.com  
**License:** MIT License  

```bash
# Deep Directory Overview
bondspace/
├── frontend/
│   ├── src/app/             # Next.js Pages (Chat, Games, Location, Auth)
│   ├── src/components/      # UI Library (Buttons, Inputs, OTA Bootstrapper)
│   ├── src/lib/             # Utils (Axios intercepters, Crypto utilities)
│   ├── android/             # Android Native Payload
│   └── capacitor.config.ts  # Cap config pulling from out/ folder
├── backend/
│   ├── src/routes/          # 18 Modular Express REST Routers
│   ├── src/db/              # SQL definition and migration files
│   └── src/socket/          # Emitting and Listening Event Registry
└── bondspace-release/       # Sub-repository for GitHub pages / binaries
```

---
<div align="center">
<b>Because every love story deserves its own universe.</b><br>
<i>Handcrafted to perfection.</i>
</div>
