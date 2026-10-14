# API Reference

## Features

- Type-safe TypeScript server using Hono
- Simple environment-based configuration
- CORS support for browser clients
- Health check endpoint
- Riot account, rank, mastery, live game, and recent match data access
- Request validation for required query parameters
- Lightweight in-memory caching for PUUID, rank, and mastery lookups; live-game status is intentionally not cached

## Health

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

## Riot data

Required query parameters:

- `region` — Riot platform region such as `kr`, `na1`, `euw1`, `jp1`
- `gameName` — Riot account name
- `tag` — Riot tag line without the `#` symbol

### Rank

```http
GET /api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1
```

Returns the rank for the requested player.

### Mastery

```http
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1
```

Optional query parameters:

- `count` — return the top `N` champion mastery entries
- `total` — return the total champion mastery points as a number
- `championName` — resolve a champion name to its Riot ID and return that champion's mastery entry

Precedence is: `championName` > `total` > `count` > default full mastery list.

Examples:

```http
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&count=5
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&total=true
GET /api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1&championName=Azir
```

Returns the matching Champion Mastery data for the requested player.

### Live game

```http
GET /api/v2/riot/live?region=kr&gameName=Faker&tag=KR1
```

Returns the current active game status as `{ inGame: true|false, mode, championId, startedAt }`.

If the player is not in a match, the spectator endpoint returns a 404 and the API converts that into `{ inGame: false }` instead of surfacing an error.

### Recent KDA

```http
GET /api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1
```

Returns the latest match KDA summary for the account, or `null` when the player has no recent match history.

### Example cURL calls

```bash
curl "http://localhost:4322/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1"
curl "http://localhost:4322/api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1"
curl "http://localhost:4322/api/v2/riot/live?region=na1&gameName=Doublelift&tag=NA1"
curl "http://localhost:4322/api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1"
```

The Riot service intentionally avoids caching live-game data because the current match state can change quickly.

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