# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-12

### Added
- New versioned API route at `/api/v2/riot` with improved endpoint design.
- Enhanced request validation and error handling.

### Changed
- Migrated all endpoints from `/api/v1/riot` to `/api/v2/riot`.
- Updated the package version to `2.0.0`.
- Improved internal API consistency and response schemas.

### Deprecated
- `/api/v1/riot` routes are no longer recommended; clients should migrate to `/api/v2/riot`.

---

## [1.0.0] - 2026-10-10

### Added
- Initial stable public release of the Riot League of Legends API service.
- Versioned API route at `/api/v1/riot`.
- Environment-based configuration for `RIOT_API_KEY`, `PORT`, and `ALLOWED_ORIGIN`.
- Hono-based HTTP app with health checks and CORS support.
- Riot data access for rank, mastery, live game status, and recent match summaries.
- In-memory TTL caching for repeat lookups such as account and rank data.
- Automated tests covering route validation, caching behavior, and Riot API error propagation.
- Public security policy and improved template documentation for contributor workflows.

### Changed
- Updated the package version to `1.0.0`.
- Standardized the public API to use the versioned path `/api/v1/riot`.
- Kept `/api/riot` as a compatibility redirect to guide older clients to the v1 route.
- Reworked README and issue templates to match the actual implementation and public usage model.

### Security
- Added explicit security guidance for self-hosted deployments and private vulnerability reporting.

---

## [Unreleased]

### Planned
- Add additional API versioning policy documentation for future breaking changes.
- Expand endpoint coverage and response schema validation.
- Consider request rate limiting and operational monitoring improvements.
