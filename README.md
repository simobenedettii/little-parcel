# Little Parcel — short links with Cloudflare Pages + D1

This version no longer stores the whole parcel inside the URL.

A created parcel is saved in Cloudflare D1 and gets a short public URL like:

`https://YOUR-SITE.pages.dev/?p=K7m2QaA91x`

The recipient does **not** need the ZIP file, an account, or any app. They only open the URL in a browser.

## What you need

- A free Cloudflare account.
- Node.js 16.17+ installed on the computer used for deployment.

Cloudflare Pages Functions can use D1 bindings. On the current Workers Free plan, Cloudflare lists 100,000 Workers requests/day. D1 Free currently lists 5 million rows read/day, 100,000 rows written/day and 5 GB total storage.

## 1. Install Wrangler

Open PowerShell in this folder:

```powershell
npm install -g wrangler
wrangler login
```

## 2. Create the D1 database

```powershell
wrangler d1 create little-parcel-db
```

Cloudflare will print a database ID. Copy it into `wrangler.toml`:

```toml
database_id = "YOUR_DATABASE_ID"
```

## 3. Create the tables

```powershell
wrangler d1 execute little-parcel-db --remote --file=./schema.sql
```

## 4. Deploy the site

Create the Pages project:

```powershell
wrangler pages project create little-parcel
```

Then deploy this folder:

```powershell
wrangler pages deploy . --project-name=little-parcel
```

After the Pages project exists, open the Cloudflare dashboard:

`Workers & Pages → little-parcel → Settings → Bindings → Add → D1 database`

Set the variable name to:

`PARCELS`

Select `little-parcel-db` and redeploy.

### Important

The `wrangler.toml` in this ZIP is a template. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` before using it as your project configuration.

## 5. Use the site

Open your Cloudflare URL, create a parcel and click **Create share link**.

The site saves the parcel through `/api/parcels` and copies a short URL such as:

`https://little-parcel.pages.dev/?p=3Hk9Q1bZa7`

That is the URL you send. The recipient simply opens it.

## Media limits in this build

The backend stores the parcel JSON in multiple D1 rows, so the URL stays short even when the parcel contains media. The builder still limits photo size to keep the database usage reasonable.

For a larger public-facing version with many large photos or audio files, Cloudflare R2 would be a better media store.

## Privacy

A parcel link is unlisted rather than password-protected. Anyone who receives the full URL can open the parcel. The random ID makes accidental guessing difficult, but it is not a security boundary.

## Current Cloudflare documentation

Deploy test

- https://developers.cloudflare.com/pages/functions/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
