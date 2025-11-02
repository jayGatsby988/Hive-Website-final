# Troubleshooting "Failed to Fetch" Error

## Quick Diagnosis

The "failed to fetch" error usually means one of these issues:

1. **Environment variables not set correctly**
2. **Invalid Supabase URL or key**
3. **Network/CORS issues**
4. **Supabase project not properly configured**

## Step-by-Step Fix

### 1. Check Your Environment Variables

First, let's verify your `.env.local` file is correct:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- Make sure there are NO spaces around the `=` sign
- Make sure there are NO quotes around the values
- Make sure the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)

### 2. Verify Your Supabase Credentials

Go to your Supabase project:
1. **Settings** → **API**
2. Copy the **Project URL** (should look like `https://abcdefgh.supabase.co`)
3. Copy the **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### 3. Test the Connection

Let's add some debugging to see what's happening. I'll update the supabase client to show more detailed error information.
