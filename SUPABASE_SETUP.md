# Supabase Setup Guide for FreelancePro

This guide will help you migrate your FreelancePro app from SQLite to Supabase PostgreSQL.

## Step 1: Create Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or login to your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `freelancepro`
   - Enter database password (save this securely!)
   - Select region closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a dashboard when ready

## Step 2: Get Connection Details

1. **Database URL**
   - Go to Settings → Database
   - Copy the "Connection string" under "Connection pooling"
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. **API Keys**
   - Go to Settings → API
   - Copy the "Project URL"
   - Copy the "anon public" key
   - Copy the "service_role" key (keep this secret!)

## Step 3: Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
# Replace these with your actual Supabase values
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
```

## Step 4: Run Database Migration

After updating your environment variables:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push your schema to Supabase
npx prisma db push

# Optional: Seed your database with initial data
node scripts/seed-data.js
```

## Step 5: Test Your Setup

```bash
# Start your development server
npm run dev

# Test the following:
# 1. User registration/login
# 2. Creating clients
# 3. Creating projects
# 4. Generating invoices
```

## Step 6: Production Deployment

For production (Vercel/Netlify):

1. **Add Environment Variables**
   - Add all the Supabase environment variables to your deployment platform
   - Use the same values from your `.env` file

2. **Database Migration**
   - Your production build will automatically run `prisma generate`
   - The database schema is already pushed to Supabase

## Troubleshooting

### Connection Issues
- Ensure your DATABASE_URL is correct
- Check that your Supabase project is active
- Verify your password is correct

### Migration Errors
- Run `npx prisma db push --force-reset` to reset and recreate tables
- Check Supabase logs in the dashboard

### Authentication Issues
- Verify NEXTAUTH_URL matches your domain
- Check that NEXTAUTH_SECRET is set

## Benefits of Supabase

✅ **Scalable PostgreSQL database**
✅ **Real-time subscriptions** (for future features)
✅ **Built-in authentication** (can replace NextAuth if desired)
✅ **Row Level Security** for data protection
✅ **Automatic backups**
✅ **Dashboard for database management**
✅ **Edge functions** for serverless logic

## Next Steps

Once your app is running on Supabase:

1. **Enable Row Level Security** for better data protection
2. **Set up database backups** in Supabase dashboard
3. **Monitor performance** using Supabase analytics
4. **Consider migrating to Supabase Auth** for additional features

Your FreelancePro app is now powered by Supabase! 🚀