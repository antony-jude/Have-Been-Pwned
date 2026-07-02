<div align="center">

# 🔐 HavePwned

### Know your exposure before an attacker does.

A privacy-conscious security dashboard that analyzes password strength, detects predictable patterns, estimates cracking time, and checks passwords and email addresses against known breach data.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Portfolio_Project-ff7133)](#)

[![Live](https://have-been-pwned.vercel.app/)

</div>

---

## Why HavePwned?

Most password meters stop at length and character variety. HavePwned goes further: it identifies the shortcuts attackers exploit—common passwords, keyboard walks, repeated characters, sequences, and predictable l33t substitutions—then turns those findings into understandable, actionable advice.

The result is a security tool that is useful to everyday users and an engineering project that demonstrates frontend architecture, algorithmic reasoning, third-party API integration, privacy-aware design, and responsive UI work.

## Highlights

- **Pattern-aware password analysis** — detects dictionary matches, repetitions, sequences, keyboard walks, and l33t substitutions.
- **Raw and effective entropy** — shows how predictable patterns reduce theoretical password strength.
- **Crack-time estimates** — compares high-speed offline attacks with rate-limited online attacks.
- **Privacy-preserving breach lookup** — sends only the first five characters of a SHA-1 password hash using the k-anonymity model; the password itself is never transmitted.
- **Email exposure intelligence** — surfaces breach sources, dates, leaked data categories, and affected-record counts.
- **Actionable feedback** — explains exactly how a password can be improved.
- **Light and dark themes** — persists the selected theme and respects the operating system preference on first visit.
- **Responsive interface** — designed for desktop, tablet, and mobile screens.

## Product experience

HavePwned uses a cinematic, security-focused interface inspired by modern SaaS landing pages: an orange event horizon, glass dashboard panels, clear status colors, and a focused scanning flow. The visual system is built entirely with CSS—no heavy UI framework or background image dependency.

## Architecture

```text
Browser (React + Vite)
├── Local password analysis
│   ├── Character-pool and entropy calculation
│   ├── Pattern and dictionary detection
│   └── SHA-1 range-prefix generation
│
└── Express API proxy
    ├── /api/pwned-check/:prefix ──► Pwned Passwords range API
    └── /api/email-check/:email  ──► XposedOrNot breach analytics
```

The browser performs password analysis locally. For a password breach check, it hashes the password in-browser and requests a hash range through the server. This keeps the full hash—and, more importantly, the original password—out of the request.

## Tech stack

| Layer | Technology |
|---|---|
| Interface | React 19, Tailwind CSS 4, custom responsive CSS |
| Build tooling | Vite 8, Oxlint |
| API server | Node.js, Express 4 |
| Password intelligence | Web Crypto API, custom entropy and pattern-detection algorithms |
| Breach intelligence | Pwned Passwords and XposedOrNot APIs |

## Run locally

### Requirements

- Node.js 18 or newer
- npm 9 or newer

### Setup

```bash
git clone https://github.com/antony-jude/Have-Been-Pwned.git
cd Have-Been-Pwned
npm run install:all
npm run dev
```

The frontend opens at `http://localhost:5173` and the API server runs at `http://localhost:3001`.

## Deploy to Vercel

The repository includes a production-ready `vercel.json` and serverless functions under `/api`. Import the repository into Vercel or use the deploy button above. Keep the project **Root Directory** set to the repository root; the included configuration installs and builds the client automatically.

No environment variables are required for the current public breach-data providers. Production requests use same-origin `/api` routes, while Vite proxies those routes to the Express server during local development.

### Useful commands

```bash
npm run dev          # Start client and server together
npm run dev:client   # Start only the Vite client
npm run dev:server   # Start only the Express API
npm run build        # Create a production client build
npm run lint         # Check the client source
```

## Security and privacy model

- Password strength calculations run entirely in the browser.
- Plaintext passwords are never logged, stored, or sent to this server.
- Breach checks use the Pwned Passwords range API's k-anonymity approach.
- The server acts as a narrow proxy and validates the supplied hash prefix.
- Email addresses are sent only when the user explicitly starts an email scan.

> **Important:** This project is an educational security aid, not a guarantee that an account or password is safe. Never reuse passwords, and use a reputable password manager with multi-factor authentication.

## What this project demonstrates

- Translating security concepts into an approachable user experience
- Building non-trivial password analysis without outsourcing core logic
- Designing clear async states for loading, success, breach, and failure results
- Integrating external APIs behind a small Express boundary
- Applying responsive design, accessible focus states, reduced-motion support, and persistent theming
- Structuring a full-stack JavaScript project with independently deployable client and server packages

## Roadmap

- Add automated tests for entropy and pattern-detection edge cases
- Move API base URLs into environment configuration for deployment
- Add rate limiting, caching, and stricter production CORS rules
- Provide a breach-history visualization and exportable security report
- Add containerized and one-click deployment options

## Data providers

This project uses breach intelligence from [Pwned Passwords](https://haveibeenpwned.com/Passwords) and [XposedOrNot](https://xposedornot.com/). All trademarks and breach data belong to their respective owners.

---

<div align="center">

Built with curiosity, security thinking, and a healthy distrust of `Password123`.

⭐ If the project helped you, consider starring the repository.

</div>
