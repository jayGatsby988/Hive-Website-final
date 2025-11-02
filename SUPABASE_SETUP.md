# Supabase Setup Guide

## Quick Fix for the Current Error

The error you're seeing is because the Supabase environment variables are not configured. Here's how to fix it:

## Step 1: Create Environment File

Create a file named `.env.local` in your project root directory (same level as `package.json`) with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Example .env.local File

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjQ2NDAwMCwiZXhwIjoxOTYyMDQwMDAwfQ.example-key-here
```

## Step 4: Restart Development Server

After creating the `.env.local` file:

1. Stop your development server (Ctrl+C)
2. Run `npm run dev` again
3. The error should be resolved

## Step 5: Set Up Database Schema

Once the environment variables are working, you'll need to run the SQL schema in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire SQL schema from your original message
4. Click **Run** to execute the schema

## Troubleshooting

### If you still see the error:
- Make sure the `.env.local` file is in the root directory
- Check that the variable names are exactly as shown (case-sensitive)
- Restart your development server
- Check the browser console for any additional error messages

### If you don't have a Supabase project yet:
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Wait for it to be ready (usually takes 1-2 minutes)
5. Follow the steps above to get your credentials

## Next Steps

Once the environment variables are set up:
1. The application will connect to your Supabase database
2. You can test user registration and login
3. Organizations and events will be stored in your database
4. All features will work with real data

The temporary fix I applied will prevent the crash, but you'll need to add your real Supabase credentials for full functionality.
