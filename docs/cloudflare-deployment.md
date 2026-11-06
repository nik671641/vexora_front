# Cloudflare Pages and Render

Production frontend: https://vexora-front.pages.dev/
Backend: https://vexora-backend-q4m1.onrender.com/

Pages Functions in `functions/api/[[path]].js` proxy `/api` and `/api/*` to
Django. Static files stay on Pages. `public/_routes.json` limits Function
invocations to API routes. Deploy from the repository root so Cloudflare can
find `functions/` alongside `package.json`.

## Build and publish

- Production branch: `master`
- Build command: `npm run build`
- Build output: `dist`
- Leave `VITE_API_BASE_URL` unset (or empty), so browser requests use `/api`.

With Git integration, push to the production branch to deploy both static
files and Functions. For a project deployed with Direct Upload, run from the
repository root after authenticating with `wrangler login`:

```powershell
npm.cmd run build
npm.cmd exec --yes --package=wrangler@4 -- wrangler pages deploy dist --project-name=vexora-front --branch=master
```

Uploading only `dist` through the dashboard does not compile the `functions/`
directory. Use Git integration or Wrangler to deploy this version.

## Render environment

```env
DJANGO_SETTINGS_MODULE=vexora.settings.production
DJANGO_ALLOWED_HOSTS=vexora-backend-q4m1.onrender.com
DJANGO_TRUST_PROXY_HEADERS=1
DJANGO_CSRF_TRUSTED_ORIGINS=https://vexora-front.pages.dev
FRONTEND_BASE_URL=https://vexora-front.pages.dev
SOCIAL_REDIRECT_ORIGIN=https://vexora-front.pages.dev
```

Keep `DJANGO_SECRET_KEY`, `DATABASE_URL`, provider credentials and `REDIS_URL`
in Render only. Production uses the `vexora_cache` database table for shared
authentication throttles and OAuth caches by default. `build.sh` creates it
idempotently. Set `DJANGO_CACHE_BACKEND=redis` to use a configured `REDIS_URL`
for caching instead. Celery workers and their Redis broker are separate from
this cache setting and still need provisioning for background generation.

Browser session and CSRF cookies remain host-only, secure and
SameSite=Lax. The proxy preserves Origin/Referer for Django's CSRF checks,
preserves separate Set-Cookie headers and never caches API responses.

If Google/Apple login is enabled, register the callback on the frontend
origin with each provider and update any explicit `GOOGLE_OAUTH_REDIRECT_URI`
or `APPLE_OAUTH_REDIRECT_URI` variables to match. For example:
`https://vexora-front.pages.dev/api/auth/social/google/callback`.

## Verify

1. `/api/health` returns JSON with database status, not the React HTML page.
2. `/api/auth/csrf` sets a secure `csrftoken` cookie and returns JSON.
3. `/api/me` without a session returns HTTP 401.
4. Sign in, reload, then sign out. Confirm `/api/me` reflects each state.

New `*.vexora-front.pages.dev` preview origins need their own Django trusted
CSRF origin if used for authenticated writes. Use the stable production URL
for the production smoke test.
