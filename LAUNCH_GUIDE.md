# QuicKeys™ V1 — Complete Launch Guide

## What's Included

```
quickeys-full/
├── src/
│   ├── app/                        All 20 screens + API routes
│   │   ├── page.tsx                S-01 Landing
│   │   ├── auth/
│   │   │   ├── signup/             S-02 Create Account
│   │   │   ├── verify/             S-03 Email Verification
│   │   │   ├── signin/             Sign In
│   │   │   ├── reset-password/     Password Reset
│   │   │   └── update-password/    Password Update
│   │   ├── onboarding/
│   │   │   ├── profile/            S-04 Profile Setup (with photo upload)
│   │   │   └── pax/                S-05/06/07/08 Meet Pax
│   │   ├── feed/                   S-09 Connection Feed
│   │   ├── profile/[id]/           S-10 Connection Profile
│   │   ├── chat/[id]/              S-11 Chat (Supabase Realtime)
│   │   ├── pax/
│   │   │   ├── checkin/            S-13 Emotional Check-In
│   │   │   ├── response/           S-14 Pax Response (verbatim)
│   │   │   ├── feedback/           S-15 Feedback
│   │   │   └── thankyou/           S-16 Thank You
│   │   ├── archived/               S-17 Archived Conversations
│   │   ├── me/                     S-18 User Profile
│   │   ├── report/                 S-19 Report User
│   │   ├── admin/
│   │   │   ├── login/              Admin Login
│   │   │   └── dashboard/          S-20 Admin Dashboard
│   │   └── api/                    All backend routes
│   ├── components/                 Shared UI components
│   └── lib/                        Supabase clients, Pax content, types
├── supabase/
│   ├── schema.sql                  Complete database schema + RLS
│   └── storage.sql                 Photo storage policies
└── LAUNCH_GUIDE.md                 This file
```

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com → New Project
2. Choose a region close to your users (recommend `us-east-1`)
3. Save these three values — you'll need them:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon / public key** (under Settings → API)
   - **service_role key** (under Settings → API — keep this secret)

---

## Step 2 — Run Database Schema

1. In Supabase → **SQL Editor** → New query
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**
4. Then paste `supabase/storage.sql` and run it too

---

## Step 3 — Configure Email (for verification)

In Supabase → **Authentication** → **Email Templates**:

Set the **Confirm signup** template redirect URL to:
```
https://your-domain.com/auth/verify
```

In **Authentication** → **URL Configuration**:
- Site URL: `https://your-domain.com`
- Redirect URLs: add `https://your-domain.com/**`

---

## Step 4 — Set Up Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Step 5 — Install & Run Locally

```bash
cd quickeys-full
npm install
npm run dev
# → Opens at http://localhost:3000
```

---

## Step 6 — Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

When prompted:
- Link to existing project or create new
- Set framework: **Next.js**

Then in Vercel Dashboard → **Settings** → **Environment Variables**, add all four from Step 4.

Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.

---

## Step 7 — Create Your Admin Account

1. Sign up normally through the app at `/auth/signup`
2. Verify your email
3. In Supabase → **SQL Editor**, run:

```sql
UPDATE profiles
SET role = 'ADMIN'
WHERE email = 'your-admin-email@example.com';
```

4. Access admin at `/admin/login`

---

## Step 8 — Add Pax Content Library

The Pax responses are currently placeholder text in `src/lib/pax.ts`.

Replace each response text with the finalized content from the Pax Content Library before launch.

The state IDs map exactly per the spec:
- `PAX_NOT_GREAT` → Not Great response
- `PAX_GOOD` → Good response
- `PAX_NEUTRAL` → Neutral response
- `PAX_CONFUSED` → Confused response
- `PAX_DISAPPOINTED` → Disappointed response
- `PAX_INTRO_ORIENTATION` → Onboarding response (hardcoded, fires once)

---

## Security Checklist Before Launch

- [ ] All env vars set in Vercel (never commit `.env.local`)
- [ ] Supabase RLS is enabled (it is — schema.sql enables it)
- [ ] `service_role` key is server-side only (never in `NEXT_PUBLIC_*`)
- [ ] Supabase email confirmation is enabled
- [ ] Storage bucket `photos` is set to **private**
- [ ] Rate limiting is enabled in Supabase (Dashboard → Auth → Rate limits)
- [ ] Admin role is only assigned manually via SQL (not self-assignable)

---

## Architecture Notes

**Auth flow**: Supabase Auth → JWT stored in secure httpOnly cookies via `@supabase/ssr`. Middleware refreshes sessions on every request.

**Real-time chat**: Supabase Realtime subscriptions on the `messages` table, filtered by `conversation_id`. No polling needed.

**Matching**: Near-random within filter parameters (gender, interest, age range, location radius). No scoring, no AI. Excludes existing conversation partners. Returns 5 profiles per refresh.

**Pax trigger system**: Two triggers — `CLOSE_CONVERSATION` (immediate on button press) and `INACTIVITY` (72h no message, detected on next login). Each trigger stored in `pax_triggers` table with full audit trail.

**Admin access**: Role-based (`ADMIN` vs `USER`). Middleware blocks all `/admin/*` routes for non-admins. Admin client uses `service_role` key server-side only.

**Photo storage**: Private Supabase Storage bucket. Photos accessed via signed URLs generated server-side. Stored at path `{user_id}/{timestamp}.{ext}`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + JWT) |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |
| Deployment | Vercel |

---

## Contacts for Approval (per spec)

- ofelia@quickeysdating.com
- amber@quickeysdating.com

Any feature additions outside V1.1 spec require written founder approval before implementation.
