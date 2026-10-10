# Riot League of Legends API Service

[![CI](https://github.com/nuu-nuu/riot-league-of-legends-api-service/actions/workflows/ci.yml/badge.svg)](https://github.com/nuu-nuu/riot-league-of-legends-api-service/actions/workflows/ci.yml)

A lightweight TypeScript API server that wraps Riot Games League of Legends endpoints and exposes a cleaner backend-friendly interface for browser or app clients.

This project is designed to be cloned and run as your own self-hosted service. The server reads a Riot API key from environment variables and proxies requests server-side instead of exposing the key directly to the browser.

---

## Features

- Type-safe TypeScript server using Hono
- Simple environment-based configuration
- CORS support for browser clients
- Health check endpoint
- Riot account, rank, mastery, live game, and recent match data access
- Request validation for required query parameters
- Lightweight in-memory caching for repeated account and rank lookups

---

## Project structure

```text
riot-league-of-legends-api-service/
├── src/
│   ├── app.ts           # HTTP app and route definitions
│   ├── config.ts        # Environment / region config
│   ├── index.ts         # Server startup and port binding
│   ├── types.ts         # Shared Riot response types
│   └── riot/
│       ├── cache.ts     # TTL cache implementation
│       ├── client.ts    # Riot fetch wrapper + error handling
│       └── service.ts   # Riot domain/service logic
├── test/
│   ├── app.test.ts
│   ├── riot-cache.test.ts
│   └── riot-client.test.ts
├── .env.example         # Sample environment variables
├── .gitignore
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── SECURITY.md
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── .env                 # Local environment file (not committed)
```

---

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Riot Games API key from the [Riot Developer Portal](https://developer.riotgames.com/)

---

## Installation

```bash
git clone https://github.com/nuu-nuu/riot-league-of-legends-api-service
cd riot-league-of-legends-api-service
npm install
cp .env.example .env
```

Then set the required values in `.env`.

---

## Environment variables

The service expects the following values in `.env`:

```env
RIOT_API_KEY=your_riot_api_key
PORT=4322
ALLOWED_ORIGIN=*
```

### Variable details

| Variable | Required | Description |
| --- | --- | --- |
| `RIOT_API_KEY` | Yes | Your Riot API key used to call Riot endpoints |
| `PORT` | No | Port for the server to listen on; defaults to `4322` |
| `ALLOWED_ORIGIN` | No | CORS allowlist. Use `*` for all origins, or a comma-separated list like `https://app.example.com,https://admin.example.com` |

---

## Running the app

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Start built app

```bash
npm start
```

---

## API endpoints

### Health

```http
GET /health
```

Returns:

```json
{
  "ok": true,
  "uptime": 123.456
}
```

### Riot data

```http
GET /api/v1/riot?region=kr&gameName=Faker&tag=KR1
```

Required query parameters:

- `region` — Riot platform region such as `kr`, `na1`, `euw1`, `jp1`
- `gameName` — Riot account name
- `tag` — Riot tag line without the `#` symbol

Optional query parameter:

- `part` — one of `rank`, `mastery`, `live`, `recent`, or `all`

Examples:

```bash
curl "http://localhost:4322/api/v1/riot?region=kr&gameName=Faker&tag=KR1"
curl "http://localhost:4322/api/v1/riot?region=kr&gameName=Faker&tag=KR1&part=all"
curl "http://localhost:4322/api/v1/riot?region=na1&gameName=Doublelift&tag=NA1&part=live"
```

### `part` behavior

- `rank` — returns ranked statistics
- `mastery` — returns top champion mastery entries
- `live` — returns current active game status
- `recent` — returns recent match KDA summary
- `all` — returns rank, mastery, and live data together
- default behavior — returns rank data if no `part` is specified

---

## Example response

```json
{
  "ok": true,
  "data": [
    {
      "queueType": "RANKED_SOLO_5x5",
      "tier": "CHALLENGER",
      "rank": "I",
      "leaguePoints": 1337,
      "wins": 500,
      "losses": 300
    }
  ]
}
```

---

## Release and versioning

This project follows semantic versioning for releases and a versioned API contract for runtime changes.

### Package versioning

The package version is tracked in [package.json](package.json) using SemVer:

```text
MAJOR.MINOR.PATCH
```

The current release is:

```text
1.0.0
```

### API versioning

This project exposes the public route at `/api/v1/riot`.

This versioned contract is intended for stable public usage. If the API changes in a breaking way in the future, a new route such as `/api/v2/riot` should be introduced instead of modifying `/api/v1/riot` in place.

### Versioning policy

- `MAJOR`: breaking changes to the API contract or required env usage
- `MINOR`: additive, backward-compatible features or improvements
- `PATCH`: bug fixes and maintenance updates

---

## Notes for public/self-hosted use

- Keep `RIOT_API_KEY` only on the backend server.
- Do not expose or hardcode API credentials in a frontend app.
- Use `ALLOWED_ORIGIN` to restrict browser access.
- Riot rate limits still apply even when this service is self-hosted.
- This service is not affiliated with Riot Games and is intended for personal or self-hosted use in accordance with Riot developer rules.

---

## Testing

```bash
npm test
```

---

## Contributing

Contributions are welcome. Please keep changes small, well-documented, and covered by tests where relevant.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Legal disclaimer

This project is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
