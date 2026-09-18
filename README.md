# Focus — Premium Pomodoro Timer

A modern, minimalist, and production-ready Pomodoro timer web application designed for deep focus and productivity tracking.

![Focus Timer](https://img.shields.io/badge/React-18.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 Core Timer
- **Three Modes**: Focus (25 min), Short Break (5 min), Long Break (15 min)
- **Circular Progress**: Elegant visual indicator with smooth animations
- **Timestamp-based Accuracy**: Timer remains accurate even when browser tab is in background or laptop goes to sleep
- **Persistence**: Timer state is preserved across page refreshes and browser restarts
- **Pomodoro Cycle**: Automatic progression (4 focus sessions → long break)

### 📊 Statistics & Analytics
- **Daily Stats**: Total focus time, completed sessions, pomodoro count
- **Weekly Chart**: Visual bar chart showing daily focus duration
- **Heatmap**: GitHub-style 90-day focus calendar
- **Focus Streak**: Track consecutive days of focused work
- **Daily Goal**: Set and track your daily focus target with progress bar
- **Session History**: Detailed log of all completed sessions

### ⚙️ Customization
- **Custom Durations**: Adjust focus, short break, and long break durations (1-180 min)
- **Auto-start**: Option to automatically start next session
- **Theme**: Light, Dark, or System preference
- **Notifications**: Browser notifications when sessions complete
- **Sound**: Audio feedback with toggle option
- **Daily Goal**: Customizable daily focus target (15-600 min)

### 💾 Data Management
- **Local Storage**: All data stored locally in your browser
- **Export/Import**: Backup and restore your data as JSON
- **Privacy First**: No data sent to external servers
- **Data Validation**: Robust error handling for corrupted data

### 🎨 Design
- **Minimalist UI**: Clean, distraction-free interface inspired by Apple, Linear, and Raycast
- **Responsive**: Mobile-first design that works beautifully on all devices
- **Accessible**: ARIA labels, keyboard navigation, screen reader support
- **Reduced Motion**: Respects `prefers-reduced-motion` preferences
- **Smooth Animations**: Subtle transitions that enhance UX without distraction

### ⌨️ Keyboard Shortcuts
- `Space` — Start / Pause / Resume
- `R` — Reset timer
- `1` — Switch to Focus mode
- `2` — Switch to Short Break
- `3` — Switch to Long Break
- `S` — Open Settings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd focus-timer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage

### First Time Setup
1. Open the app — it starts with a 25-minute focus timer
2. Click **Start** to begin your first session
3. No configuration needed — works out of the box!

### Customizing Settings
1. Click the **Settings** icon (⚙️) in the header
2. Adjust timer durations, auto-start preferences, notifications
3. Set your daily focus goal
4. Choose your preferred theme

### Tracking Progress
1. Click the **Stats** icon (📊) in the header
2. View daily, weekly, and 30-day statistics
3. Check your focus streak and heatmap
4. Review session history

### Backup & Restore
1. Go to **Settings** → **Data**
2. Click **Export Data** to download a JSON backup
3. Click **Import Data** to restore from a backup file

## 🛠️ Tech Stack

- **React 18.2** — UI framework
- **TypeScript 5.7** — Type safety
- **Tailwind CSS 4.1** — Utility-first styling
- **Vite 6.3** — Build tool
- **Lucide React** — Icon library
- **LocalStorage** — Data persistence

## 📁 Project Structure

```
src/
├── App.tsx          # Main application component
├── types.ts         # TypeScript type definitions
├── store.ts         # Data persistence & utilities
├── index.css        # Global styles & animations
└── main.tsx         # Application entry point

public/
└── manifest.json    # PWA manifest
```

## 🔒 Privacy & Security

- **100% Local**: All data stored in your browser's localStorage
- **No Tracking**: Zero analytics or telemetry
- **No External APIs**: Works completely offline
- **Open Source**: Inspect every line of code

## 🎯 Design Philosophy

**Less interface, more focus.**

Focus Timer follows these principles:
- Timer is the primary focus — everything else is secondary
- Minimal visual noise — no gradients, shadows, or decorative elements
- Calm color palette — orange for focus, green for breaks, blue for long breaks
- Whitespace is intentional — gives your eyes room to breathe
- Mobile-first — thumb-friendly controls, optimized for one-handed use

## 🌟 Key Technical Decisions

### Timestamp-based Timer
Instead of `setInterval(() => seconds--)`, we use `Date.now()` to calculate elapsed time. This ensures accuracy even when:
- Browser throttles background tabs
- Laptop enters sleep mode
- User switches to another tab

### Smart Persistence
- Timer state saved every 5 seconds (not every tick)
- Immediate save on session completion
- Graceful degradation if localStorage is corrupted

### State Machine
Timer follows a clear state machine:
```
IDLE → RUNNING → COMPLETED
       ↓
     PAUSED → RUNNING
```

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License — feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Inspired by:
- [Apple Design](https://developer.apple.com/design/)
- [Linear](https://linear.app/)
- [Raycast](https://www.raycast.com/)
- Modern productivity tools that respect user attention

## 📞 Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Made with ❤️ for focused work**
