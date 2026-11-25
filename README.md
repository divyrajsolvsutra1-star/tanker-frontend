# Tanker frontend

The frontend uses Next.js with the Pages Router and TypeScript. Reusable UI
components live in `src/components/common`, environment configuration is in
`src/config`, and shared API requests live in `src/lib`.

The common UI exports include `Button`, `Card`, `PageContainer`, `DataTable`,
and `Dialog`. `DataTable` accepts typed column renderers and stable row keys;
`Dialog` uses the native modal dialog with a controlled `open` state.

Authentication pages are available at `/login` and `/activate`. Signed-in
Owner/Admin users can manage invitations at `/users`. Users set a password and
enroll a TOTP authenticator before the backend creates an eight-hour session.
Role permissions are configurable by Owner/Admin at `/roles`.

## Getting started

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Set
`NEXT_PUBLIC_API_URL` in `.env.local` to the backend API base URL. Values with
the `NEXT_PUBLIC_` prefix are included in browser bundles and must not contain
secrets. Start the Express backend separately and configure its MongoDB URI and
MFA encryption key before using sign-in or invitation flows.
From the workspace root, `npm run dev` starts both applications together.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — run the TypeScript compiler without emitting files
