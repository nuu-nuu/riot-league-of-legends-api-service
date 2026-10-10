# Security Policy

## Supported versions

This repository is maintained as a public, self-hosted service. Security updates are applied to the current `main` branch and to the latest published release when available.

| Branch / release | Supported |
| --- | --- |
| `main` | Yes |
| Latest tagged release | Yes |
| Older tags / forks / unpinned clones | Best effort only; not guaranteed |

If you are running a clone of this project, it is strongly recommended to keep your local copy aligned with the latest upstream changes.

---

## Reporting a vulnerability

Please do not open a public issue for a security problem. Public disclosure can expose sensitive information before a fix is available.

Instead, report the issue privately through the GitHub repository's security tooling:

- Open the repository on GitHub
- Go to the Security tab
- Select Advisories
- Click "Report a vulnerability"

If a GitHub Security Advisory is not available for the project at the time of reporting, use the repository owner or maintainer contact method listed on the project page and clearly label the report as a security issue.

---

## What to include in the report

Please include the following details if possible:

- A description of the vulnerability and its potential impact
- Steps or a proof of concept to reproduce it
- Affected routes, files, or deployment setup
- Relevant logs or configuration information
- Any evidence of exploitation or impact

---

## Response expectations

We aim to acknowledge valid security reports promptly and to work toward a fix as quickly as possible.

- Initial acknowledgment: within 48 hours when possible
- Status updates: as investigation continues
- Fix coordination: once a safe patch is available
- Responsible disclosure: public disclosure will be coordinated after the issue is addressed

---

## Security reminders for users

Because this service calls the Riot API using a server-side key, the following practices are strongly recommended:

- Keep `RIOT_API_KEY` only on the backend server
- Do not embed the Riot API key in frontend code
- Restrict `ALLOWED_ORIGIN` to trusted domains
- Validate and sanitize input before relying on it in downstream requests
- Rotate credentials if they are ever exposed

---

## Abuse and misuse

This project is intended to provide a proxy layer for Riot data access under the developer terms of the Riot API and the relevant service policies. Do not use the project to:

- bypass rate limits or developer restrictions
- expose private keys in client-side code
- use the service in a way that violates Riot's terms or local legal requirements
- build untrusted or abusive scraping or automation against Riot endpoints

If you suspect abuse or a security issue in deployment, report it privately and do not publicly disclose it until it has been reviewed.
