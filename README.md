# Audiobook Manager

**Audiobook Manager** is a desktop application built with **Electron**, **React**, **Vite**, and **TailwindCSS** to manage audiobooks locally. It uses **SQLite** for persistent storage, with a modern interface based on Radix UI.

---

## 🧰 Main Technologies

- [Electron](https://www.electronjs.org/) – desktop packaging and execution
- [React 18](https://react.dev/) – building the user interface
- [Vite](https://vitejs.dev/) – fast build and development server
- [Tailwind CSS](https://tailwindcss.com/) – utility-first styling
- [SQLite](https://www.sqlite.org/index.html) – local database
- [Dexie.js](https://dexie.org/) – IndexedDB (transitioning to SQLite)
- [Zod](https://zod.dev/) – schema validation
- [Radix UI](https://www.radix-ui.com/) – unstyled and accessible UI components
- [Electron Builder](https://www.electron.build/) – final application packaging

---

## 🚀 Installation and Running

### ⚠️ Important during development:

In development mode, you must **change the `main` field in `package.json`** from:

```json
"main": "dist/main.js"
```

to:

```json
"main": "src/electron/main.js"
```

This ensures Electron uses the source files directly instead of the final build.

---

### Prerequisites

- Node.js v18 or higher
- NPM v9 or higher

---

### 1. Install dependencies

```bash
npm install
```

---

### 2. Initial build (required due to SQLite usage)

Before running Electron, generate the front-end build:

```bash
npm run build
```

---

### 3. Run the application

```bash
npm run electron
```

> 💡 The `npm run dev` command **is not sufficient** on its own due to SQLite integration. Always run `npm run build` before starting Electron.

---

## 🛠️ Available Scripts

| Script           | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `dev`            | Starts Vite in development mode _(⚠️ do not use alone with SQLite)_ |
| `build`          | Builds the front-end with Vite                                      |
| `build:dev`      | Builds in development mode                                          |
| `lint`           | Runs ESLint                                                         |
| `preview`        | Serves the built app for preview                                    |
| `electron`       | Starts Electron with current code                                   |
| `copy:main`      | Copies files from `src/electron` to `dist`                          |
| `electron:build` | Full production build (.exe)                                        |
| `postinstall`    | Installs native Electron dependencies                               |

---

## 🧪 Production Build (.exe)

To package the app as a Windows executable (.exe):

```bash
npm run electron:build
```

The generated package will be available in the `dist/` folder.

---

## 📁 Expected Structure

```
/
├── src/
│   ├── electron/       # main Electron scripts
│   └── renderer/       # React + UI code
├── dist/               # Electron build output
├── dist-react/         # Vite build (renderer)
├── audiobookIcon.png   # app icon
├── package.json
└── README.md
```

---

## 📦 Distribution

Electron Builder is configured to generate builds for Windows (`portable` and `msi`). Other targets can be easily added in the `build` field of `package.json`.

---

## 🧱 Roadmap

- [x] Integration with IndexedDB via Dexie
- [x] Local SQLite support
- [ ] Cloud sync (future)
- [ ] Support for chapters and bookmarks
- [ ] Dark/system theme

---

## 📄 License

This project is currently **private**. Contact the author for more information.

---

## 👤 Author

Gabriel Feitosa  
[LinkedIn](https://www.linkedin.com/in/gabriel-feitosa-b02b70186)

---
