# Putting a4africa.org live — a4a-v1b

**Stack:** Supabase (database, sign-in, photos) + Vercel (website hosting) + Hostinger (your domain).
All three are free at this stage. Follow the steps in order; it takes about 45 minutes.

> This project is completely separate from RC247. Use a **new** Supabase project and a **new** Vercel project for it.

---

## Step 1 — Create the Supabase project

1. Go to **supabase.com** → sign in → **New project**.
2. Name: `a4africa`. Set a strong database password and save it somewhere safe.
3. Region: choose the closest available to Nigeria (e.g. **West EU (London)** or **Central EU (Frankfurt)**).
4. Wait about 2 minutes for it to finish setting up.

## Step 2 — Set up the database (one paste)

1. In Supabase, open **SQL Editor** → **New query**.
2. Open the file `supabase/setup.sql` from this project, copy **all** of it, paste it in, and click **Run**.
3. You should see "Success. No rows returned." This creates the tables, the security rules, and the private **story-images** photo storage.

## Step 3 — Configure sign-in

In Supabase, go to **Authentication → URL Configuration**:

- **Site URL:** `https://a4africa.org`
- **Redirect URLs** (add each one):
  - `https://a4africa.org/**`
  - `https://www.a4africa.org/**`
  - `https://*.vercel.app/**`
  - `http://localhost:8080/**`

**Email sign-in** works straight away. Note: Supabase's built-in email sender is limited to a few emails per hour. That's fine for launch; later you can connect free SMTP (e.g. Resend) under **Authentication → Emails → SMTP Settings**.

**Google sign-in** (optional; until you set it up, the Google button just shows an error):

1. Go to **console.cloud.google.com** → create a project called `a4africa`.
2. **APIs & Services → OAuth consent screen** → External → app name `a4africa.org`, your support email → save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
4. Under **Authorized redirect URIs**, add the callback URL shown in Supabase under **Authentication → Sign In / Providers → Google** (it looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
5. Copy the **Client ID** and **Client secret** into Supabase's Google provider and turn it **on**.

## Step 4 — Put the code on GitHub

Vercel deploys from GitHub. Create a free account at github.com if you don't have one, then pick one option:

- **Easiest:** create an empty **private** repository called `a4africa` and send Claude the name (e.g. `yourname/a4africa`). Claude can push the code for you.
- **Yourself:** unzip `a4africa-a4a-v1b.zip` on your computer, open the new repository, and use **Add file → Upload files** to drag in everything inside the `a4africa` folder. (GitHub's upload page takes 100 files at a time, so you may need two rounds: first `src`, then the rest.)

## Step 5 — Deploy on Vercel

1. Go to **vercel.com** → sign up **with GitHub**.
2. **Add New → Project** → import the `a4africa` repository.
3. Build settings (open **Build and Output Settings** if they aren't filled in):
   - Framework Preset: **Other**
   - Install Command: `bun install`
   - Build Command: `bun run build`
   - Output Directory: leave empty (the build writes Vercel's format automatically)
4. **Environment Variables**: add each of these (values come from Supabase → **Project Settings → API Keys** and **Data API**):

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` |
| `VITE_SUPABASE_URL` | the same Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | the **publishable** (or `anon`) key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the same publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | the **secret** (or `service_role`) key — never share this |

5. Click **Deploy**. After about a minute you'll get a link like `a4africa-xyz.vercel.app`. Open it and check the homepage loads.

## Step 6 — Become the administrator

On the live site, click **Sign in → Create an account** and sign up with **your** email. **The very first account created becomes the administrator** automatically. Confirm your email, sign in, and the **Admin desk** link appears in the menu. You can make other people administrators from the Admin desk.

## Step 7 — Connect a4africa.org (Hostinger)

1. In Vercel: **Project → Settings → Domains** → add `a4africa.org`, then add `www.a4africa.org` (let Vercel redirect `www` to the main domain).
2. Vercel shows the DNS records it needs. Usually these are:
   - **A** record, name `@`, value `76.76.21.21`
   - **CNAME** record, name `www`, value `cname.vercel-dns.com`

   **Always use the exact values Vercel shows you** if they differ.
3. In **Hostinger → Domains → a4africa.org → DNS / Nameservers → DNS records**:
   - Delete any existing **A** record for `@` and any **CNAME** for `www` (these point to Hostinger's parking page).
   - Add the two records from Vercel.
   - **Don't touch the MX records** if you use Hostinger email.
4. Wait 10 minutes to a few hours. Vercel shows **Valid Configuration** and switches on HTTPS by itself.

## Step 8 — Final checks

- [ ] Visit `https://a4africa.org` — the homepage loads.
- [ ] Submit a test story with a photo, approve it on the Admin desk, and check it appears on the homepage.
- [ ] Share the story link on WhatsApp and check the preview shows the photo and title.
- [ ] Send a test message from the Contact page and check it shows in the Admin desk inbox.
- [ ] Update the contact email in `src/lib/site.ts` (currently `hello@a4africa.org`) to an inbox you actually check.
- [ ] Google Search Console: add `a4africa.org`, verify it (add the TXT record in Hostinger DNS), and submit `https://a4africa.org/sitemap.xml`.

## Optional — email alerts for new stories and messages

1. Sign up at **resend.com** (free: 3,000 emails/month) and create an API key.
2. Add to Vercel's environment variables: `RESEND_API_KEY` = your key, `ADMIN_ALERT_EMAIL` = where alerts go (separate several addresses with commas).
3. To send from your own address, verify `a4africa.org` in Resend (it gives you DNS records to add in Hostinger), then set `ALERT_FROM_EMAIL` = `a4africa.org <alerts@a4africa.org>`.
4. In Vercel, **Deployments → ⋯ → Redeploy** so the new settings take effect.

---

### Running it on your own computer (optional)

```
bun install
cp .env.example .env     # fill in the Supabase values
bun run dev              # opens on http://localhost:8080
```

### About the old Lovable version

The Lovable project (a4africa.lovable.app) still uses Lovable's own database. This version doesn't touch it. Once a4africa.org is live on Vercel, you can leave the Lovable project alone or delete it.
