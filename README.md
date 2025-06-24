# Pomodoro PWA Frontend

A modern, offline-capable Progressive Web App (PWA) for Pomodoro time management built with React, TypeScript, and Vite.

## ✨ Features

- 🍅 **Pomodoro Timer**: Customizable 25/5/15 minute cycles
- 📱 **PWA Support**: Installable, works offline, app-like experience
- 🔄 **Auto-start Options**: Automatically start breaks/pomodoros
- 📊 **Statistics**: Track completed pomodoros and focus time
- ⚙️ **Settings**: Customize durations and preferences
- 🔐 **Authentication**: User accounts with data sync
- 💾 **Offline Support**: Works without internet, syncs when online

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Backend API running (see backend README)

### Installation
```bash
git clone <your-repo-url>
cd pomodoro-frontend
npm install

# Set up environment variables
cp env.production .env.local
# Edit .env.local: VITE_API_URL=http://localhost:5000/api

npm run dev
# Open http://localhost:5173
```

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure
```
src/
├── components/          # UI components (Timer, forms, etc.)
├── pages/              # Page components (Home, Settings, Stats)
├── lib/                # API client, utilities, backup
├── contexts/           # React contexts
└── assets/             # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Set environment variable: `VITE_API_URL=https://your-backend.vercel.app/api`
5. Deploy!

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

### PWA Features
- **Service Worker**: Caching and offline functionality
- **Web App Manifest**: App metadata and icons
- **Auto-updates**: Service worker updates automatically
- **Installable**: Can be added to home screen

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Look for the install icon in the address bar
3. Click "Install Pomodoro App"

### Mobile (Chrome/Edge)
1. Open the app on your phone
2. Tap "Add to Home Screen"
3. The app will appear on your home screen

## 🔄 Offline Functionality

- **Timer**: Works completely offline
- **Settings**: Uses local storage, syncs when online
- **Statistics**: Tracks locally, syncs when online
- **Authentication**: Requires internet for login

## 📊 Features

### Timer
- Three modes: Pomodoro, Short Break, Long Break
- Customizable durations
- Auto-start options
- Visual countdown

### Statistics
- Completed pomodoros count
- Total focus time
- Offline tracking
- Data sync when online

### Settings
- Pomodoro duration (default: 25 min)
- Short break duration (default: 5 min)
- Long break duration (default: 15 min)
- Auto-start options
- Reset to defaults option

### Backup & Restore
- Export/import local data
- Server backup for logged-in users
- JSON format backup files

---

