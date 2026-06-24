# QuicKeys™ V1 — Technical Summary
*Required deliverable per Section 6 of V1 Full Developer Build Document*

## Stack Decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 (App Router) | Spec preference. Server components + API routes in one repo. |
| Styling | Tailwind CSS | Rapid iteration, mobile-first, matches clean spec aesthetic. |
| Backend | Next.js API Routes | Eliminates separate Express server. All endpoints in `/src/app/api/`. |
| Database | Supabase (PostgreSQL) | Spec preference. Built-in auth, realtime, storage, RLS. |
| Auth | Supabase Auth + `@supabase/ssr` | JWT tokens in httpOnly cookies. Auto-refreshed by middleware. |
| Real-time chat | Supabase Realtime (WebSocket) | Postgres changes subscription on `messages` table. No polling. |
| Photo storage | Supabase Storage (private bucket) | Photos accessed via signed URLs only. Never publicly accessible. |
| Deployment | Vercel | Spec preference. Edge middleware, preview deploys, instant rollbacks. |

## Architecture Notes

**Inactivity detection**: Checked on every login via `GET /api/pax`. The feed page is fully blocked until the check resolves. If pending triggers exist, the user is redirected to `/pax/checkin?triggers={ids}&index=0` before the feed renders. Multiple inactive conversations fire in sequence via URL index param — survives page refreshes. Both users in a conversation get their own independent trigger records.

**Pax response delivery**: V1 responses stored verbatim in `src/lib/pax.ts`. Retrieved by state ID and displayed exactly as written. No AI processing. V1 rule enforced — no API call to any AI endpoint in the response path.

**PAX_INTRO_ORIENTATION**: Hardcoded directly in `src/app/onboarding/pax/page.tsx`. Not retrieved from the Pax Content Library. Fires once per user. `pax_onboarded` boolean in profiles table prevents repeat.

**Photo access**: All photo URLs are signed (1-hour expiry) via `supabase.storage.createSignedUrl()`. Public URL access is never used. Admin photo removal deletes from both storage and the `photos[]` array in the profile row.

**Admin access**: Middleware at `/src/middleware.ts` checks role on every request to `/admin/*`. Uses service_role client server-side for admin API routes. ADMIN role must be manually assigned via SQL — not self-assignable.

**Usage events**: Tracked via `POST /api/usage` with event types LOGIN, SCREEN_VIEW, SESSION_END. Client hook `useUsageTracking(screenName)` records entry time and posts session duration on unmount.

## Key Files

```
src/middleware.ts              — Route protection + session refresh (edge)
src/lib/pax.ts                 — Pax Content Library (replace with final copy before launch)
src/lib/supabase/server.ts     — Server client (regular + admin)
src/lib/supabase/client.ts     — Browser client
src/app/api/pax/route.ts       — Pax trigger system (both trigger types)
src/app/api/conversations/     — Conversation CRUD + message send
src/app/api/admin/             — Admin-only endpoints (stats, moderation)
supabase/schema.sql            — Full database schema + RLS policies
supabase/storage.sql           — Storage bucket + access policies
```

## Known Issues / Limitations

1. **Pax Content Library**: Response text in `src/lib/pax.ts` is placeholder. Must be replaced with finalized content from Intellectual Healing™ before launch.

2. **Photo signed URLs**: 1-hour expiry. For production, consider a server-side signed URL proxy endpoint to avoid URL expiry mid-session. Supabase's `createSignedUrl` is called client-side which means the anon key is used — appropriate for authenticated users with correct RLS policies.

3. **Location matching**: The spec requires matching "Within location radius" but lat/long coordinates are not collected. City/state text matching is stored. A future V1.1 improvement would be to geocode city/state at profile creation and use PostGIS for radius queries.

4. **Rate limiting**: Auth endpoint rate limiting is configured in Supabase Dashboard → Authentication → Rate limits. Not implemented at the application layer. Supabase's built-in limits (email OTP: 60/hour, signups: 30/hour) apply by default.

5. **Email templates**: Supabase default email templates are used. Founders should customize these in Supabase Dashboard → Authentication → Email Templates before beta launch.

## Recommended Next Steps (V1.1)

1. Replace placeholder Pax responses in `src/lib/pax.ts` with finalized content
2. Customize Supabase email templates (verification, password reset)
3. Set up Supabase rate limits in dashboard for auth endpoints
4. Add geocoding for proper radius-based matching (PostGIS)
5. Create a GitHub repository and push codebase with clean commit history
6. Set up Vercel preview environments for each PR
7. Configure custom domain in Vercel
8. Test full user flow end-to-end with 10-15 internal testers before beta

## Deliverables Checklist

✓ Live hosted web application accessible via URL (deploy with `vercel --prod`)
✓ All 20 screens built and functional per specification
✓ Email verification flow working
✓ Pax trigger system — Close Conversation and Inactivity (72h), sequential, gated
✓ All 5 state IDs mapped, verbatim responses, no AI processing
✓ PAX_INTRO_ORIENTATION hardcoded, fires once per user
✓ Feedback mechanism capturing binary + open text, all optional
✓ Report User flow (S-19) storing all 6 required fields
✓ Admin dashboard (S-20) — all 5 analytics sections
✓ Admin moderation: suspend, restore, deactivate, photo removal, data export
✓ All admin actions logged with timestamp and admin user ID
✓ Role-based access (ADMIN / USER)
✓ Secure JWT auth with email verification and password reset
✓ Photo upload with private Supabase Storage (signed URLs)
✓ Real-time chat via Supabase Realtime (WebSocket)
✓ Inactivity detection at 72h, fires before feed, sequential for multiple
✓ Archived conversations read-only, sorted by close date
✓ 5-profile simultaneous feed with all 4 eligibility filters
✓ Usage event tracking (login, screen views, session duration)
✓ GitHub repository with clean documented code
✓ Technical summary (this document)
