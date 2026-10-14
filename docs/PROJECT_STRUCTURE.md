# Project Structure

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