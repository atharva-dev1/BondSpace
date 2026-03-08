# 🎨 BondSpace Frontend (Next.js + Capacitor)

> **Welcome to the UI and Presentation Layer of BondSpace.** 
> This repository contains the Next.js 16 Web Application that is simultaneously packaged as a Native Android Application using Capacitor 6 and deployed to the web via Vercel/GitHub Pages.

---

## 📑 Table of Contents
1. [🏗️ Frontend Architecture](#-frontend-architecture)
2. [🖌️ UI & UX Philosophy (Glassmorphism)](#%EF%B8%8F-ui--ux-philosophy-glassmorphism)
3. [🚀 Mobile Native & OTA Engine (Crucial)](#-mobile-native--ota-engine-crucial)
4. [🧠 State Management (Zustand)](#-state-management-zustand)
5. [🔐 Security & E2E Implementation](#-security--e2e-implementation)
6. [🔌 WebSocket & Real-Time Sync](#-websocket--real-time-sync)
7. [📂 Directory Structure Breakdown](#-directory-structure-breakdown)
8. [⚙️ Development & Build Commands](#%EF%B8%8F-development--build-commands)

---

## 🏗️ Frontend Architecture

The BondSpace frontend is not a standard React SPA. It utilizes **Next.js 16 (App Router)** but specifically tailored for **Static Export (`output: export`)**.

Why? Because traditional SSR (Server-Side Rendering) cannot run inside a Mobile Webview (APK). By exporting statically:
1. We get blazing fast load times globally.
2. The HTML/JS/CSS assets are entirely bundled inside the `android/app/src/main/assets/public/` folder for offline mobile execution.
3. We can hot-swap the `_next` folder dynamically during OTA Updates.

---

## 🖌️ UI & UX Philosophy (Glassmorphism)

BondSpace was designed to feel like a premium, Silicon-Valley tier startup app.
- **Glassmorphism:** Heavy use of `backdrop-blur-md` and `bg-white/10` across components (Navbar, Modals, Cards).
- **Gradients:** Deep custom neon gradients (`var(--pink)` to `var(--purple)`) providing visual hierarchy.
- **Framer Motion:** Every single page transition, modal pop, and toast message is wrapped in `<motion.div>` for physics-based fluid animations.
- **Tailwind CSS v4:** Complete utility-first approach. No external CSS files except standard index directives.

---

## 🚀 Mobile Native & OTA Engine (Crucial)

This is the most complex mechanism in the frontend.

### 1. Capacitor Integration
Capacitor injects a native bridge object (`window.Capacitor`) into the Webview.
We use Capacitor APIs for:
- Native Toasts & Haptics (`@capacitor/haptics`)
- Filesystem Access for OTA updates (`@capacitor/filesystem`)
- Background Tasks & Notifications

### 2. Over-The-Air (OTA) Updating system
When an Android user opens the app, the root `<OTABootstrap>` overlay mounts.
1. It queries `https://api.github.com/repos/Ashwinjauhary/BondSpace-Release/releases/tags/latest-bundle`.
2. Checks the `published_at` date against a locally stored `localStorage.getItem('LAST_OTA_DATE')`.
3. If Remote > Local:
    - Displays a "Downloading Update..." Glassmorphism spinner.
    - Uses `@capacitor-community/http` to download `bundle.zip`.
    - Unzips it silently over the app's `public/` directory using `@capacitor/filesystem`.
    - Calls `window.location.reload(true)` to instantly boot the new UI without the Play Store.

---

## 🧠 State Management (Zustand)

Instead of bulky Redux, BondSpace relies on multiple atomic **Zustand** stores inside `/src/store/`:

| Store | Purpose | Sync |
|---|---|---|
| `authStore.ts` | Holds JWT tokens, user object, and couple pairing status. | Persisted via `localstorage` |
| `chatStore.ts` | Holds currently decrypted messages and active typing statuses. | Ephemeral |
| `gameStore.ts` | Tracks live game turn data (e.g., Redis state of TicTacToe). | Ephemeral |
| `themeStore.ts` | Controls CSS Variable overrides (Unlocked via Love Arena). | Persisted via `localstorage` |

---

## 🔐 Security & E2E Implementation

**Client-Side Cryptography is handled by `libsodium-wrappers`.**
1. On initial login, `authStore` attempts to unseal the private Ed25519 key from LocalStorage.
2. Inside the `/components/chat/` module, when a user types "I love you" and hits send:
   - The frontend fetches the partner's public key from the backend.
   - It performs `crypto_box_easy` combining the plaintext + nonces + shared secret.
   - Outputs a Base64 ciphertext.
   - Only the Base64 ciphertext is pushed via `Socket.IO`. 
3. **The `Node.js` server never parses the plain text.**

---

## 🔌 WebSocket & Real-Time Sync

A singleton `socket.ts` instance connects to the backend upon successful JWT validation.

### Key Event Listeners:
- **`on('receive_message', decryptPayload)`**: Instantly attempts to decrypt incoming messages.
- **`on('partner_location', updateLeaflet)`**: Shifts the map marker using smooth CSS transforms.
- **`on('guru_response', appendStream)`**: Appends LLM generated text from the Love Guru into the chat timeline.

---

## 📂 Directory Structure Breakdown

```bash
bondspace/frontend/
├── android/                   # Native Capacitor Gradle Project
├── src/
│   ├── app/                   # Next.js Routing
│   │   ├── (auth)/            # Login, Register, Join Pair
│   │   ├── dashboard/         # Main hubs (Games, Chat, Settings)
│   │   ├── landing/           # SEO-friendly landing page
│   │   └── layout.tsx         # Root `<OTABootstrap>` injection
│   │
│   ├── components/            # Reusable UI library
│   │   ├── common/            # Buttons, Inputs, GlassCards
│   │   ├── chat/              # Chat bubbles, E2E logic wrapper
│   │   └── maps/              # Leaflet dynamic renderer
│   │
│   ├── hooks/                 # Custom React logic
│   │   ├── useSocket.ts       # Centralized socket hook
│   │   └── useCrypto.ts       # libsodium helpers
│   │
│   └── store/                 # Zustand Global States
│
├── public/                    # Static Assets (Images, Icons)
├── next.config.ts             # Export configuration
├── capacitor.config.ts        # App ID, Name, WebDir pointer
└── tailwind.config.ts         # Design Tokens (Colors, Blur radii)
```

---

## ⚙️ Development & Build Commands

### Local Web Development
```bash
npm run dev
# Starts Next.js server on localhost:3000
```

### Building for Web Production
```bash
npm run build
# Compiles App to '/out' folder (Static HTML/CSS/JS)
```

### Simulating Native Mobile Build (OTA Bundle)
```bash
export MOBILE_BUILD=true
npm run build
# This strips web-only routing and prepares the UI for Capacitor constraints
```

### Exporting and Syncing to Android Studio
```bash
npx cap sync android
# Copies the '/out' folder into the Android res/assets folder
npx cap open android
# Boots Android Studio to compile the signed APK
```

---

<div align="center">
<i>Built with absolute precision for the modern couple.</i>
</div>
