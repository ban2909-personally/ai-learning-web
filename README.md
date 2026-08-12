# AI Learning Platform Web

React web application for the B2C AI Learning Platform.

## Stack

- React 19 and TypeScript
- Vite and Tailwind CSS
- Vitest and React Testing Library

## Run locally

```powershell
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

`VITE_API_URL` must point to the versioned backend base URL, for example `http://localhost:8080/api/v1`.

## Verify

```powershell
pnpm lint
pnpm test
pnpm build
```
