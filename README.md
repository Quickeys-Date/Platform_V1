# QuicKeys™ — V1 Full Production App

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Real-time chat**: Supabase Realtime
- **File storage**: Supabase Storage
- **Deployment**: Vercel

---

## Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com → New Project
2. Save your **Project URL** and **anon key** and **service_role key**

### 2. Run Database Schema
In Supabase → SQL Editor, run the contents of `supabase/schema.sql`

### 3. Configure Supabase Storage
In Supabase → Storage → Create bucket named `photos` → set to **private**

### 4. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Install & Run
```bash
npm install
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```
Add all env vars in Vercel dashboard → Settings → Environment Variables.

---

## Admin Access
- Navigate to `/admin/login`
- Create admin user in Supabase → Authentication → Users
- In SQL Editor run: `UPDATE profiles SET role = 'ADMIN' WHERE email = 'your@email.com';`

---

## Architecture

```
/app
  /page.tsx              → S-01 Landing
  /auth
    /signup/page.tsx     → S-02 Create Account
    /verify/page.tsx     → S-03 Email Verification
    /signin/page.tsx     → Sign In
  /onboarding
    /profile/page.tsx    → S-04 Profile Setup
    /welcome/page.tsx    → S-05 Welcome
    /pax/page.tsx        → S-06/07/08 Meet Pax
  /feed/page.tsx         → S-09 Connection Feed
  /profile/[id]/page.tsx → S-10 Connection Profile
  /chat/[id]/page.tsx    → S-11 Chat
  /archived/page.tsx     → S-17 Archived Conversations
  /me/page.tsx           → S-18 User Profile
  /report/page.tsx       → S-19 Report User
  /admin
    /login/page.tsx      → Admin Login
    /dashboard/page.tsx  → S-20 Admin Dashboard
/api
  /auth/...              → Auth endpoints
  /profiles/...          → Profile CRUD
  /conversations/...     → Conversation management
  /messages/...          → Chat messages
  /pax/...               → Pax trigger system
  /reports/...           → Report submission
  /admin/...             → Admin-only endpoints
```
