# a4africa.org — a4a-v1b5

The good side of Africa, told by its people. A server-rendered TanStack Start app with a public story site, story submission with photo upload, sign-in (email + Google), contributor tools, and an admin review desk.

**Hosting:** Vercel (free) · **Backend:** Supabase (free) · **Domain:** Hostinger

➡️ **To put it live, follow [DEPLOY.md](./DEPLOY.md).** Database setup is the single file `supabase/setup.sql`.

## Pages
| Path | What it is |
|---|---|
| `/` | Homepage: hero, approved stories, country + category filters |
| `/stories/:id` | Shareable story page (WhatsApp, X, Facebook, copy link) |
| `/submit` | Submission desk: submit, edit or withdraw pending stories, see editor notes |
| `/auth`, `/reset-password` | Sign in, sign up, Google sign-in, forgot/reset password |
| `/about`, `/guidelines`, `/contact`, `/privacy` | Content pages; the contact form is stored in Supabase |
| `/admin` | Admin desk: review queue, approve/reject/delete, contact inbox, admin accounts |

## Settings
- Site-wide settings (contact email, URL): `src/lib/site.ts`
- Environment variables: see `.env.example`

## Commands
`bun install` · `bun run dev` (port 8080) · `bun run build` (outputs `.vercel/output`)
