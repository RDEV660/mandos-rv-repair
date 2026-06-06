# Owner Dashboard Setup

Mando's RV website includes a password-protected owner dashboard at **`/admin/`**.

## What owners can edit

- **Logo** — upload or change path
- **Brand colors** — navy, orange, amber, backgrounds
- **Phone & address** — updates all call buttons and map
- **Hero text** — headline, badges, subtitle
- **Hero slideshow** — add/remove/replace photos
- **Our Work** — roof & floor project photos and captions
- **About, contact, footer** — section titles and paragraphs
- **Reviews** — three customer quotes

Click **Save All Changes** when finished, then refresh the main site.

## Default login (change immediately on Vercel)

| Setting | Default |
|---------|---------|
| Password | `MandoAdmin2026!` |

## Local testing

```bash
npm install
npm run dev
```

- Website: http://localhost:3000
- Dashboard: http://localhost:3000/admin/

Saves write to `data/site-content-live.json` locally.

## Production (Vercel) — required env variables

In Vercel → Project → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Owner login password (pick a strong one) |
| `ADMIN_SECRET` | Random long string for session tokens (optional; uses password if omitted) |
| `BLOB_READ_WRITE_TOKEN` | **Required for saves on live site.** Create at Vercel → Storage → Blob |

Without `BLOB_READ_WRITE_TOKEN`, the dashboard loads but **Save** will fail on production.

## Footer link

Visitors see a discreet **Owner Login** button at the bottom of every page.
