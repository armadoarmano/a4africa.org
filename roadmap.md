# a4africa.org roadmap

## a4a-v1b (12 Oct 2026)
- [x] New A4A logo: Africa map mark with gold 4 and Madagascar; favicon, app icon, social image

## a4a-v1 (12 Oct 2026)
- [x] Moved off Lovable: builds for Vercel; Google sign-in now uses Supabase directly
- [x] Single database setup script incl. the photo storage bucket (was missing)
- [x] Auto-created profiles; first sign-up becomes administrator
- [x] Shared header/footer, phone menu, forgot/reset password
- [x] About, Guidelines, Contact (form + admin inbox), Privacy pages
- [x] Homepage hero, category filter, social preview image, contributor credit
- [x] Story share buttons; contributors can edit/withdraw pending stories and see editor notes
- [x] Admin: delete stories, contact inbox, optional email alerts (Resend)

## To do (owner)
- [ ] Follow DEPLOY.md: Supabase → GitHub → Vercel → Hostinger DNS
- [ ] Set real contact email in src/lib/site.ts
- [ ] Have the privacy policy reviewed
- [ ] Google Search Console + sitemap

## Ideas for later
- Pagination / "load more" once there are 100+ stories
- Featured story pinned by admins
- Newsletter sign-up
