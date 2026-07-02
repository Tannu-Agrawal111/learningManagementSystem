# Learning Management System (LMS)

## Overview

This repository contains a simple **Learning Management System** built with a **Node.js** backend and a **JavaScript/HTML/CSS** frontend. The project demonstrates a full‑stack web application that can be run locally for development and testing.

## Directory Structure

```
📦 lms
├─ 📁 client   # Front‑end (HTML, CSS, JavaScript)
├─ 📁 server   # Back‑end (Node.js/Express)
└─ 📄 README.md
```

## Prerequisites

- **Node.js** (v20 or later) – includes npm
- **Git** (optional, for version control)

## Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository‑url>
   cd lms
   ```
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install client dependencies (if any are listed in `client/package.json`):
   ```bash
   cd ../client
   npm install   # optional – many client files are plain static assets
   ```

## Running the Application

### Development Mode

- **Full stack** – run both client and server concurrently:
  ```bash
  npm run dev
  ```

- **Frontend only** – watches source files and serves them with hot‑reloading:
  ```bash
  cd client
  npm run dev
  ```

- **Backend only** – starts the Node.js server with nodemon for auto‑restart:
  ```bash
  cd server
  npm run dev   # uses nodemon
  ```

The client will normally be available at `http://localhost:3000` (or the port shown in the console) and will proxy API calls to the backend running on `http://localhost:5000` (adjust as needed).

### Production Build

If you want to build a static bundle for deployment:
```bash
cd client
npm run build   # creates a `dist/` folder
```
Copy the contents of `dist/` to the server’s public directory or serve them via a static file server.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug‑fix.
3. Ensure code follows existing style conventions.
4. Submit a pull request with a clear description of changes.

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---


