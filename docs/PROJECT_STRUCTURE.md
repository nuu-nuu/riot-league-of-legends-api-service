# Project Structure

```text
riot-league-of-legends-api-service/
├── .github/                 # GitHub configuration and automation
├── docs/
│   ├── API.md               # API endpoint documentation
│   ├── CHANGELOG.md         # Version history
│   ├── LICENSE              # Documentation license
│   ├── PROJECT_STRUCTURE.md # Project layout overview
│   ├── SECURITY.md          # Security policy
│   └── VERSIONING.md        # Versioning conventions
├── src/
│   ├── app.ts               # HTTP app and route definitions
│   ├── cache.ts             # Shared app cache utilities
│   ├── config.ts            # Environment and region configuration
│   ├── ddragon/
│   │   ├── cache.ts         # DDragon cache layer
│   │   ├── client.ts        # DDragon API client wrapper
│   │   └── service.ts       # DDragon domain/service logic
│   ├── index.ts             # Server startup and port binding
│   ├── riot/
│   │   ├── cache.ts         # Riot cache implementation
│   │   ├── client.ts        # Riot fetch wrapper + error handling
│   │   └── service.ts       # Riot domain/service logic
│   └── types.ts             # Shared Riot / API response types
├── test/
│   ├── Request.rest         # Manual HTTP request examples
│   ├── app.test.ts          # App-level test coverage
│   ├── riot-cache.test.ts   # Riot cache tests
│   └── riot-client.test.ts  # Riot client tests
├── .env                     # Local environment file (not committed)
├── .env.example             # Sample environment variables
├── .gitignore
├── LICENSE                  # Project license
├── package.json             # Scripts and dependencies
├── pnpm-workspace.yaml      # PNPM workspace config
├── README.md                # Project overview and setup guide
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest configuration
└── package-lock.json        # Lockfile for npm-based installs
```
