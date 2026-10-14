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
- Lightweight in-memory caching for PUUID, rank, and mastery lookups; live-game status is intentionally not cached

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

Required query parameters:

- `region` — Riot platform region such as `kr`, `na1`, `euw1`, `jp1`
- `gameName` — Riot account name
- `tag` — Riot tag line without the `#` symbol

#### Rank

```http
GET /api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1
```

Returns the rank for the requested player.

#### Mastery

```http
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1
```

Optional query parameters:

- `count` — return the top `N` champion mastery entries
- `total` — return the total champion mastery points as a number
- `championName` — resolve a champion name to its Riot ID and return that champion’s mastery entry

Precedence is: `championName` > `total` > `count` > default full mastery list.

Examples:

```http
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&count=5
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&total=true
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&championName=Azir
```

Returns the matching Champion Mastery data for the requested player.

#### Live game

```http
GET /api/v2/riot/live?region=kr&gameName=Faker&tag=KR1
```

Returns the current active game status as `{ inGame: true|false, mode, championId, startedAt }`.

If the player is not in a match, the spectator endpoint returns a 404 and the API converts that into `{ inGame: false }` instead of surfacing an error.

#### Recent KDA

```http
GET /api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1
```

Returns the latest match KDA summary for the account, or `null` when the player has no recent match history.

Examples:

```bash
curl "http://localhost:4322/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1"
curl "http://localhost:4322/api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1"
curl "http://localhost:4322/api/v2/riot/live?region=na1&gameName=Doublelift&tag=NA1"
curl "http://localhost:4322/api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1"
```

The Riot service intentionally avoids caching live-game data because the current match state can change quickly.

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
2.1.0
```

### API versioning

This project exposes the public route at `/api/v2/riot`.

This versioned contract is intended for stable public usage. If the API changes in a breaking way in the future, a new route should be introduced instead of modifying the current contract in place.

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
