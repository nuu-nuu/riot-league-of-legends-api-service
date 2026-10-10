# 🎮 Riot League of Legends API Service

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Riot Games API](https://img.shields.io/badge/Riot%20Games-API-d0212b.svg)

A lightweight, robust, and type-safe microservice built with **TypeScript** and **Node.js** for interacting with the **Riot Games League of Legends API**. Designed for high performance, smooth rate-limit handling, and clean integration into frontend apps or downstream backend services.

---

## ✨ Features

- 🚀 **Fast & Type-Safe:** Fully typed requests and responses using TypeScript.
- 🔑 **Centralized Auth & Config:** Simple environment-based configuration (`.env`).
- 🛡️ **Rate Limit Friendly:** Optimized request handling to protect your Riot Developer API key.
- 🛠️ **Developer Ready:** Pre-configured build pipelines (`tsc`), hot-reloading for development, and clean error handling.

---

## 📁 Project Structure

```text
riot-league-of-legends-api-service/
├── src/
│   ├── index.ts          # Main application entry point
│   ├── config/           # Environment and API configurations
│   ├── controllers/      # Route controllers and request handlers
│   ├── services/         # Riot API wrapper and business logic
│   └── types/            # TypeScript interfaces & Riot API types
├── .env.example          # Sample environment variables configuration
├── .gitignore            # Git exclusion rules
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript compiler configuration
└── README.md             # Project documentation
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**, **pnpm**, or **yarn**
- A **Riot Games API Key** (Get one at the [Riot Developer Portal](https://developer.riotgames.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/nuunuu-/riot-league-of-legends-api-service.git](https://github.com/nuunuu-/riot-league-of-legends-api-service.git)
   cd riot-league-of-legends-api-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and configure your settings:
   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your details:
   ```env
   PORT=3000
   NODE_ENV=development
   RIOT_API_KEY=RGAPI-your-actual-api-key-here
   RIOT_REGION=euw1
   ```

---

## 🚀 Running the Application

- **Development Mode (with hot-reload):**
  ```bash
  npm run dev
  ```

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Start Production Server:**
  ```bash
  npm start
  ```

---

## 📜 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check status |
| `GET` | `/api/v1/summoner/:name` | Get summoner profile data by account name |
| `GET` | `/api/v1/matches/:puuid` | Fetch match history for a given PUUID |

*(Feel free to update or extend the routes table based on your controller routes)*

---

## 🤝 Contributing

Contributions are always welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## ⚖️ Legal Disclaimer

`riot-league-of-legends-api-service` isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
