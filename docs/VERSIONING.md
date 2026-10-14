# Release and Versioning

This project follows semantic versioning for releases and a versioned API contract for runtime changes.

## Package versioning

The package version is tracked in [package.json](../package.json) using SemVer:

```text
MAJOR.MINOR.PATCH
```

The current release is:

```text
2.1.0
```

## API versioning

This project exposes the public route at `/api/v2/riot`.

This versioned contract is intended for stable public usage. If the API changes in a breaking way in the future, a new route should be introduced instead of modifying the current contract in place.

## Versioning policy

- `MAJOR`: breaking changes to the API contract or required env usage
- `MINOR`: additive, backward-compatible features or improvements
- `PATCH`: bug fixes and maintenance updates