# 💳 Expense Tracker & Financial Manager

A modern, responsive, and offline-first Personal Finance & Expense Tracker built with **React 19**, **Vite**, **Tailwind CSS**, and **Capacitor for Android**. 

Features real-time financial tracking, interactive 7-day outflow trends, Google Sheets cloud synchronization, and multi-tiered Android device memory persistence that survives phone reboots.

---

## ✨ Features

### 🏠 1. Dashboard & Financial Overview
- **Hero Balance Card**: Total balance, real-time inflow, and outflow matrix.
- **7-Day Outflow Pattern**: Interactive day-by-day bar chart with previous/next week navigation (`<` / `>`) and a 1-tap "This Week" reset button.
- **Recent Transactions**: Quick access to latest transactions with category icons and payment method tags.

### 💰 2. Dedicated Income & Expense Tracking
- Segmented views for **Income** and **Expense** tracking.
- Category breakdown with visual percentage allocation.
- Quick logging buttons with contextual skeletons.

### 📅 3. Interactive Calendar & Past-Date Logging
- Built-in native calendar picker to easily record transactions for **yesterday**, **2 days ago**, or **any custom past date**.
- 1-tap preset date chips: `Today`, `Yesterday`, `2 Days Ago`, `Pick Date 📅`.
- Accurate ISO timestamping for historical ledger ordering.

### 📜 4. Records & Searchable History
- Full transaction history ledger with live keyword search (title, note, category, or amount).
- Type filter chips: `All`, `Income`, `Expense`.
- Interactive detail modal with edit and delete capabilities.

### 📊 5. Reports & Analytics
- Multi-period breakdown: **Daily**, **Monthly**, **Yearly**, and **All Time**.
- Category-wise spending & earnings distribution.
- **Exports & Sharing**:
  - **Export CSV Spreadsheet**: Downloads CSV on web or triggers native Android system share sheet (WhatsApp, Gmail, Drive).
  - **Share Summary Text**: Formats net inflow/outflow summary for instant clipboard copy or sharing.
  - **Print / PDF Statement**: Formatted financial summary print view.

### 📱 6. Android Native Integration & Phone Restart Protection
- **Survives Phone Reboots**: Powered by a multi-tiered storage architecture (`@capacitor/preferences` Android `SharedPreferences` + `@capacitor/filesystem` `Directory.Data` + `localStorage`).
- **100% Offline Capability**: Add, edit, or delete transactions without an internet connection or Google Sheets; data is saved directly in Android device memory.
- **Hardware Back Button Handling**: Smart hierarchical back navigation (closes open sub-modals, closes drawers, steps back through tab history, and features double-tap back to exit on Home).
- **Native Share Dialog**: Seamless export integration via `@capacitor/share`.

### ☁️ 7. Optional Google Sheets Cloud Sync
- Connects directly to Google Apps Script Web App for cloud spreadsheet backup.
- Offline action queue: Queues transactions created or updated while offline and automatically syncs when reconnection is established.

### 🎨 8. Premium Micro-Interactions & Skeleton Loaders
- Tailored shimmer skeleton loaders across **Home**, **Income**, **Expense**, **Records**, and **Reports** tabs.
- Modal opening skeleton animations for zero layout shift (**zero-CLS**).
- Custom 3D personal finance profile avatar and branded logo assets.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, Vite 8 |
| **Styling** | Tailwind CSS 3, Modern Design Tokens |
| **Icons & Typography** | Google Material Symbols, Inter Font Family |
| **Mobile Runtime** | Capacitor 8 (Android) |
| **Native Plugins** | `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/share` |
| **Storage Architecture** | Android Native `SharedPreferences` + `Directory.Data` + `localStorage` |
| **Cloud Database** | Google Sheets (via Google Apps Script API) |

---

## 📁 Project Structure

```
expense-app/
├── android/                      # Native Android project (Capacitor)
├── public/                       # Static public assets (avatar, brand logo)
├── src/
│   ├── assets/                   # App icons, avatars, brand screen assets
│   ├── components/
│   │   ├── BottomNav.jsx         # Bottom navigation with skeleton transitions
│   │   ├── CreateFormModal.jsx   # Add/Edit transaction with calendar picker
│   │   ├── ExpenseTracking.jsx   # Dedicated expense view & categories
│   │   ├── Header.jsx            # Persistent top bar & connection pill
│   │   ├── HomeOverview.jsx      # Dashboard & 7-day outflow chart
│   │   ├── IncomeTracking.jsx    # Dedicated income view & categories
│   │   ├── PageSkeletons.jsx     # Shimmer skeleton loader library
│   │   ├── RecordsHistory.jsx    # Transaction ledger & search
│   │   ├── ReportsBreakdown.jsx  # Analytics, filters, CSV exports
│   │   ├── Sidebar.jsx           # Side drawer navigation
│   │   └── ViewRecordModal.jsx   # Detailed transaction view modal
│   ├── pages/
│   │   └── FormsManagement.jsx   # Core app state & offline coordinator
│   ├── utils/
│   │   ├── offlineStorage.js     # Native multi-tier persistence & queue
│   │   └── transactionUtils.js   # Date parsing, currency, and math helpers
│   ├── App.jsx                   # Root component
│   ├── index.css                 # Global CSS & Tailwind utilities
│   └── main.jsx                  # Application entry point
├── capacitor.config.json         # Capacitor mobile configuration
├── package.json                  # Dependencies & scripts
└── tailwind.config.js            # Tailwind theme configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Android Studio** (for building and running the Android APK)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd "expense app"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📱 Android Build with Capacitor

### 1. Sync Web Build to Android
```bash
npm run build
npx cap sync
```

### 2. Open in Android Studio
```bash
npx cap open android
```

### 3. Run on Device or Emulator
From Android Studio, click **Run** (or press `Shift + F10`) to deploy directly to your connected Android smartphone or emulator.

---

## ☁️ Google Sheets Cloud Setup (Optional)

1. Open **Google Sheets** and create a new spreadsheet.
2. Open **Extensions > Apps Script** and deploy a web app with `doGet` and `doPost` handlers.
3. Add your deployment URL to `SHEET_API_URL` on line 31 of [`src/pages/FormsManagement.jsx`](src/pages/FormsManagement.jsx):
```javascript
const SHEET_API_URL = 'https://script.google.com/macros/s/<YOUR_SCRIPT_ID>/exec';
```
*(Leave empty to run in 100% offline Android device memory mode).*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
