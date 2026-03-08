<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-ff69b4?style=for-the-badge&logo=github" alt="version"/>
<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
<img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js"/>
<img src="https://img.shields.io/badge/PostgreSQL-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Socket.IO-realtime-010101?style=for-the-badge&logo=socket.io" alt="Socket.IO"/>
<img src="https://img.shields.io/badge/Love%20Guru-AI%20Powered-ff69b4?style=for-the-badge&logo=sparkles" alt="AI"/>
<img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License"/>

# 💖 BondSpace

### *Your Private Digital Universe for Two*

> **BondSpace** is a full-stack relationship super-app built for couples and close friends — a private, encrypted, and gamified space to chat, play, share moments, plan futures, and grow together.

[**✨ Live Demo**](#) · [**📖 Docs**](#) · [**🐛 Report Bug**](../../issues) · [**💡 Request Feature**](../../issues)

---

</div>

## 🌟 What is BondSpace?

BondSpace is not just another messaging app. It's a **complete relationship companion** — combining:

- 🔒 **End-to-End Encrypted Chat** with disappearing messages
- 📍 **Real-time Mutual Location Sharing** with consent controls
- 🎮 **20+ Relationship Mini-Games** to strengthen your bond
- 🌳 **Bond Tree** — a living visual timeline of your relationship
- 🤖 **Love Guru** — your private AI relationship guide
- 🏆 **Gamification** — earn XP, level up, unlock rewards
- 💌 **Digital Love Letters** — time-locked, encrypted, and magical
- 🖼️ **Shared Gallery** with Cloudinary-powered cloud storage
- 🌍 **Community Spaces** for like-minded couples

---

## 📸 Screenshots

> *(Screenshots coming soon — app is in active development)*

| Feature | Preview |
|---|---|
| 💬 Chat Interface | Real-time E2E encrypted messaging |
| 📍 Location Map | Interactive Leaflet map with live tracking |
| 🎮 Game Library | 20+ love-themed mini-games |
| 🌳 Bond Tree | Visual relationship timeline |
| 🤖 AI Guru | Personalized relationship advice |
| 🏆 Love Arena | XP store with stickers, frames & themes |

---

## ⚡ Feature Deep Dive

<details>
<summary>💬 <strong>Secure & Rich Chat</strong></summary>

- 🔐 **End-to-End Encryption** using `libsodium` (NaCl crypto)
- 💨 **Disappearing Messages** with configurable TTL
- 🎤 **Voice Notes** support
- 🖼️ **Image & Video sharing** via Cloudinary CDN
- ❤️ **Emoji Reactions** on messages
- 📌 **Pinned Messages** with custom labels
- 💬 **Reply-to** threads
- 📖 **Read Receipts**
- 🏷️ **Sticker** support (unlockable in the Arena)
</details>

<details>
<summary>📍 <strong>Mutual Location Sharing</strong></summary>

- 🌍 Real-time location via **Socket.IO + Leaflet Maps**
- ✅ **Mutual consent** system — both partners must agree
- 🔕 **Request to stop** sharing with mutual confirmation flow
- 🏠 **"Reached Home" alerts**
- 🔋 **Battery level** tracking
- 📜 **Location history logs** (with timestamps)
</details>

<details>
<summary>🎮 <strong>20+ Love-Themed Games</strong></summary>

| Game | Type |
|------|------|
| Who Knows Me Better | Quiz |
| Rapid Questions | Quiz |
| Truth or Dare | Truth/Dare |
| Guess the Emoji | Quiz |
| This or That | Vote |
| Story Builder | Collaborative Story |
| Love Bingo | Bingo |
| Couple Puzzle | Puzzle |
| Personality Challenge | Quiz |
| Compatibility Test | Quiz |
| Love Language Quiz | Quiz |
| Mood Guessing Game | Quiz |
| Predict Partner | Prediction |
| Memory Match | Match |
| Photo Guess | Match |
| Secret Vote | Vote |
| Future Planning Quiz | Quiz |
| Random Confession | Other |
| Daily Question | Quiz |
| Couple Trivia | Quiz |

- ⚡ Real-time gameplay via **Socket.IO rooms**
- 🏆 Win streaks & XP rewards
- 🔁 Game state persistence with **Redis**
</details>

<details>
<summary>🤖 <strong>Love Guru & Smart Planner</strong></summary>

- 🧠 **Love Guru** — your personal AI relationship advisor (proprietary engine)
- 💬 Relationship advice, conflict resolution, love tips
- 📅 **AI Date Planner** — generates personalized date ideas
- 📈 **Relationship Health Score** analysis (Communication, Trust, Interaction, Activity, Bond Strength)
- 💾 Full conversation history persisted per couple
</details>

<details>
<summary>🌳 <strong>Bond Tree & Timeline</strong></summary>

- 📅 Track **relationship milestones** (first chat, first photo, trips, etc.)
- 🌱 Visual tree that **grows** with your relationship
- 🖼️ Attach photos & media to each milestone
- ✍️ Custom event types and descriptions
</details>

<details>
<summary>🏆 <strong>Gamification & Love Arena</strong></summary>

- ⭐ **XP (Love XP)** earned from: check-ins, games, chat streaks, activities
- 📊 **Couple Level** system (1–∞)
- 🔥 **Streak Days** tracking
- 🛒 **Love Arena Store** — spend XP to unlock:
  - Custom Sticker Packs 🎉
  - Profile Frames 🖼️
  - App Themes 🎨
  - Custom Emoji Packs 😍
- 🏅 Achievement badges
</details>

<details>
<summary>💌 <strong>Digital Love Letters</strong></summary>

- ✍️ Write **time-locked encrypted letters** to your partner
- ⏰ Triggers: Anniversary, Birthday, Custom Date
- 🔓 Auto-unlocks on the specified date
- 🔐 Content encrypted client-side
</details>

<details>
<summary>🌍 <strong>Community Spaces</strong></summary>

- 🧑‍🤝‍🧑 **Anonymous 1-on-1 Chat** — private matching outside your couple space
- 💬 **Group communities**: Coding Couples, Long Distance Love, Marriage Planning, Friendship Circle
- 👑 Role system: Admin, Moderator, Member
- 📣 Real-time community messaging
</details>

<details>
<summary>🖼️ <strong>Shared Gallery</strong></summary>

- 📁 **Album templates**: First Meet, Trips, Food, Random, Custom
- ☁️ **Cloudinary CDN** for image/video storage & delivery
- 📸 Both photos and videos supported
- ✏️ Captions on every media item
</details>

<details>
<summary>🎯 <strong>Couple Goals</strong></summary>

- 🗺️ Shared goals: Travel, Savings, Fitness, Custom
- 📊 Progress tracking with current vs target values
- 📅 Target date with countdown
- ✅ Mark goals as achieved
</details>

---

## 🏗️ Architecture

```
bondspace/
├── frontend/                   # Next.js 16 App (React 19)
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── chat/           # E2E encrypted chat
│       │   ├── games/          # Game library & sessions
│       │   ├── gallery/        # Shared photo albums
│       │   ├── location/       # Real-time map
│       │   ├── guru/           # AI relationship advisor
│       │   ├── bond-tree/      # Relationship timeline
│       │   ├── arena/          # XP store
│       │   ├── letters/        # Time-locked love letters
│       │   ├── planner/        # AI date planner
│       │   ├── community/      # Group spaces
│       │   ├── store/          # Sticker store
│       │   ├── wall/           # Couple wall
│       │   ├── profile/        # User profile
│       │   └── join/           # Couple bonding flow
│       ├── components/         # Reusable UI components
│       ├── store/              # Zustand global state
│       ├── hooks/              # Custom React hooks
│       └── lib/                # API client & utilities
│
└── backend/                    # Express.js 5 API Server
    └── src/
        ├── routes/             # 18 API route modules
        │   ├── auth.js         # JWT authentication
        │   ├── bond.js         # Couple bonding logic
        │   ├── messages.js     # Chat messages
        │   ├── games.js        # Game engine
        │   ├── gamification.js # XP & levels
        │   ├── gallery.js      # Media management
        │   ├── location.js     # Location tracking
        │   ├── location_consent.js  # Consent flow
        │   ├── aiGuru.js       # AI chat interface
        │   ├── letters.js      # Love letters
        │   ├── community.js    # Community spaces
        │   ├── anonymous_chat.js # Anonymous 1-on-1
        │   ├── healthScore.js  # Relationship health
        │   ├── goals.js        # Couple goals
        │   ├── planner.js      # AI date planner
        │   ├── store.js        # Arena store
        │   ├── invite.js       # Invite system
        │   └── wall.js         # Couple wall
        ├── socket/             # Socket.IO event handlers
        ├── middleware/         # Auth & security middleware
        ├── db/                 # PostgreSQL schema & queries
        ├── services/           # Business logic services
        ├── config/             # App configuration
        └── lib/                # Shared utilities
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | Full-stack React framework with App Router |
| **React 19** | UI component library |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **Zustand** | Lightweight global state management |
| **Framer Motion** | Animations & transitions |
| **Socket.IO Client** | Real-time bidirectional events |
| **Leaflet + React-Leaflet** | Interactive maps for location sharing |
| **Fabric.js** | Canvas-based drawing/image editor |
| **libsodium-wrappers** | Client-side E2E encryption |
| **Lucide React** | Icon library |
| **date-fns** | Date formatting & manipulation |
| **React Globe.gl** | 3D globe visualizations |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 18+** | JavaScript runtime |
| **Express.js 5** | Web application framework |
| **PostgreSQL** | Primary relational database |
| **Redis** | Game state, sessions, real-time caching |
| **Socket.IO** | Real-time WebSocket communication |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Cloudinary** | Media CDN (images, videos, audio) |
| **Love Guru Engine** | Proprietary AI for relationship advice |
| **Nodemailer** | Email OTP & notifications |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |
| **node-cron** | Scheduled tasks (letter unlocking, etc.) |
| **Multer** | File upload handling |
| **express-rate-limit** | API rate limiting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **Redis** v7+
- A **Cloudinary** account (free tier works)
- A **Love Guru AI** API key (provided on request)

### 1. Clone the Repository

```bash
git clone https://github.com/Ashwinjauhary/bondspace.git
cd bondspace
```

### 2. Install All Dependencies

```bash
# Install root + backend + frontend in one command
npm run install:all
```

Or manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment Variables

**Backend** — copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

Fill in the values:
```env
# Server
PORT=5005
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bondspace

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Love Guru AI
LOVE_GURU_API_KEY=your_love_guru_api_key

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Optional - for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

**Frontend** — copy `.env.example` to `.env.local`:
```bash
cd frontend
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5005
NEXT_PUBLIC_SOCKET_URL=http://localhost:5005
```

### 4. Set Up the Database

```bash
# Create the PostgreSQL database
createdb bondspace

# Run the schema (includes seed data for games, communities & unlockables)
cd backend
psql -d bondspace -f src/db/schema.sql

# Or use the setup script
npm run db:setup
```

### 5. Start Development Servers

```bash
# From the root — runs both frontend & backend concurrently
npm run dev
```

Or start them separately:
```bash
# Terminal 1 - Backend (http://localhost:5005)
cd backend && npm run dev

# Terminal 2 - Frontend (http://localhost:3000)
cd frontend && npm run dev
```

---

## 📡 API Reference

All API routes are prefixed with `/api`.

| Module | Base Route | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, Login, OTP verification |
| Bond | `/api/bond` | Couple bonding, invite, passcode |
| Messages | `/api/messages` | E2E encrypted chat messages |
| Location | `/api/location` | Real-time location updates |
| Location Consent | `/api/location-consent` | Mutual consent for sharing |
| Games | `/api/games` | Game library & sessions |
| Gamification | `/api/gamification` | XP, levels, achievements |
| Gallery | `/api/gallery` | Albums & media upload |
| AI Guru | `/api/ai-guru` | AI chat & relationship advice |
| Letters | `/api/letters` | Time-locked encrypted letters |
| Community | `/api/community` | Group spaces & messaging |
| Anonymous Chat | `/api/anon-chat` | Private 1-on-1 anonymous chat |
| Health Score | `/api/health-score` | Relationship health metrics |
| Goals | `/api/goals` | Couple goal tracking |
| Planner | `/api/planner` | AI-powered date planner |
| Store | `/api/store` | Arena XP store |
| Invite | `/api/invite` | Invite link generation |
| Wall | `/api/wall` | Couple wall posts |

---

## 🔌 Real-time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `send_message` | Client → Server | Send an encrypted message |
| `receive_message` | Server → Client | Receive a new message |
| `location_update` | Client → Server | Push GPS coordinates |
| `partner_location` | Server → Client | Receive partner's location |
| `game_action` | Client → Server | Submit game move |
| `game_state` | Server → Client | Game state update |
| `typing` | Client → Server | Typing indicator |
| `partner_typing` | Server → Client | Partner is typing |
| `location_consent_request` | Server → Client | Partner wants to stop sharing |
| `location_consent_response` | Client → Server | Accept/decline consent request |

---

## 🗄️ Database Schema

BondSpace uses **20 PostgreSQL tables** with UUID primary keys:

```
users               → Profiles, moods, love languages
couples             → Bond status, anniversary, location settings
messages            → E2E encrypted chat (text/voice/image/sticker)
message_reactions   → Emoji reactions on messages
location_logs       → GPS history with battery level
games               → 20 seeded game definitions
game_sessions       → Active/completed game state (JSONB)
points              → XP, levels, streaks, achievements
unlockables         → Stickers, frames, themes, emoji packs
user_unlockables    → Per-user unlocked rewards
gallery_albums      → Photo album templates
gallery_media       → Cloudinary media (photos/videos)
timeline_events     → Bond Tree milestones
love_letters        → Time-locked encrypted letters
health_scores       → Relationship health metrics
couple_goals        → Travel, savings, fitness goals
communities         → Group spaces with categories
community_members   → User roles (admin/mod/member)
community_messages  → Group chat messages
ai_guru_chats       → AI conversation history
notifications       → In-app notification log
```

---

## ☁️ Deployment

### Backend — Render / Railway / Fly.io

The project includes a `render.yaml` for one-click Render deployment:

```yaml
# backend/render.yaml
# Deploys the Node.js backend as a web service
```

1. Push to GitHub
2. Connect your repo to [render.com](https://render.com)
3. Set environment variables in the Render dashboard
4. Deploy!

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the frontend directory
cd frontend
vercel
```

Set the following environment variables in Vercel:
- `NEXT_PUBLIC_API_URL` → your backend URL
- `NEXT_PUBLIC_SOCKET_URL` → your backend URL

### Database — Supabase / Railway PG / AWS RDS

Any PostgreSQL v14+ provider works. Just update `DATABASE_URL` in your backend environment.

---

## 🔒 Security Features

- 🔐 **JWT Authentication** with long-lived tokens + refresh logic
- 🛡️ **Helmet.js** — sets security HTTP headers
- 🚦 **Rate Limiting** — prevents API abuse
- 🔑 **bcrypt (12 rounds)** — password hashing
- 🧂 **libsodium NaCl** — client-side E2E encryption for messages
- 🔢 **OTP Verification** — email-based identity verification
- 💨 **Disappearing Messages** — server-side TTL enforcement
- 🍪 **CORS** — strict origin whitelisting

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a **Pull Request**

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📋 Roadmap

- [ ] 📱 **Mobile App** (React Native / Expo)
- [ ] 🎵 **Voice & Video Calls** (WebRTC integration)
- [ ] 📤 **Push Notifications** (Firebase Cloud Messaging)
- [ ] 🌐 **Multi-language support** (i18n)
- [ ] 🤝 **Relationship Therapist AI** mode
- [ ] 🎂 **Smart Anniversary Reminders**
- [ ] 🏠 **Home widget** for partner's status
- [ ] 🔄 **Offline sync** with service workers

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for every couple on Earth

**BondSpace** — *Because every love story deserves its own universe.*

⭐ **Star this repo if you found it helpful!** ⭐

[![GitHub stars](https://img.shields.io/github/stars/yourusername/bondspace?style=social)](https://github.com/yourusername/bondspace)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/bondspace?style=social)](https://github.com/yourusername/bondspace/fork)

</div>
