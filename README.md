# BondSpace 💖

BondSpace is a private digital universe designed for two people to connect, play, and grow their relationship.

## Features 🚀
- **Secure Chat**: E2E principles with disappearing messages and voice notes.
- **Mutual Location**: Shared privacy with consent-based location sharing.
- **21+ Games**: Interactive games designed to strengthen your bond.
- **Bond Tree**: A visual record of your relationship milestones.
- **AI Guru & Planner**: Relationship advice and date planning powered by AI.
- **Love Arena Store**: Earn XP and unlock rewards.

## Project Structure 📁
- `/frontend`: Next.js application (React, Tailwind 4, Zustand).
- `/backend`: Express.js server (PostgreSQL, Socket.IO, Redis).

## Getting Started 🛠️

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   # Root
   npm install
   # Frontend
   cd frontend && npm install
   # Backend
   cd ../backend && npm install
   ```
3. Set up environment variables based on `.env.example` in both folders.
4. Start development servers:
   ```bash
   # Frontend
   cd frontend && npm run dev
   # Backend
   cd backend && npm run dev
   ```

## Deployment 🌐
Refer to [Deployment Guide](./documentation/deployment_guide.md) for production setup instructions.
