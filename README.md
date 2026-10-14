# Riot League of Legends API Service

[![CI](https://github.com/nuu-nuu/riot-league-of-legends-api-service/actions/workflows/ci.yml/badge.svg)](https://github.com/nuu-nuu/riot-league-of-legends-api-service/actions/workflows/ci.yml)

A lightweight TypeScript API server that wraps Riot Games League of Legends endpoints and exposes a cleaner backend-friendly interface for browser or app clients.

This project is designed to be cloned and run as your own self-hosted service. The server reads a Riot API key from environment variables and proxies requests server-side instead of exposing the key directly to the browser.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Riot Games API key from the [Riot Developer Portal](https://developer.riotgames.com/)

### Installation

```bash
git clone https://github.com/nuu-nuu/riot-league-of-legends-api-service
cd riot-league-of-legends-api-service
npm install
cp .env.example .env
```

Then set the required values in `.env`. See [Configuration](#configuration) below.

### Running the app

#### Development

```bash
npm run dev
```

#### Production build

```bash
npm run build
```

#### Start built app

```bash
npm start
```

### Testing

```bash
npm test
```

### Contributing

Contributions are welcome. Please keep changes small, well-documented, and covered by tests where relevant.

### License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Configuration

### Environment variables

The service expects the following values in `.env`:

```env
RIOT_API_KEY=your_riot_api_key
PORT=4322
ALLOWED_ORIGIN=*
```

#### Variable details

| Variable | Required | Description |
| --- | --- | --- |
| `RIOT_API_KEY` | Yes | Your Riot API key used to call Riot endpoints |
| `PORT` | No | Port for the server to listen on; defaults to `4322` |
| `ALLOWED_ORIGIN` | No | CORS allowlist. Use `*` for all origins, or a comma-separated list like `https://app.example.com,https://admin.example.com` |

### Notes for public/self-hosted use

- Keep `RIOT_API_KEY` only on the backend server.
- Do not expose or hardcode API credentials in a frontend app.
- Use `ALLOWED_ORIGIN` to restrict browser access.
- Riot rate limits still apply even when this service is self-hosted.
- This service is not affiliated with Riot Games and is intended for personal or self-hosted use in accordance with Riot developer rules.

---

## Documentation

- [Project Structure](docs/PROJECT_STRUCTURE.md) — repo layout
- [API Reference](docs/API.md) — endpoints, query params, example responses
- [Release and Versioning](docs/VERSIONING.md) — SemVer and API versioning policy

---

## Legal disclaimer

This project is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.