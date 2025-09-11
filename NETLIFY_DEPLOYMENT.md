# Netlify Deployment Guide

## Prerequisites
- Netlify account
- GitHub repository with your code

## Deployment Steps

### 1. Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your repository

### 2. Build Settings
The build settings are already configured in `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3. Environment Variables
Add these environment variables in Netlify dashboard:

**Required:**
- `DATABASE_URL`: Your database connection string
- `NEXTAUTH_SECRET`: A random secret for NextAuth.js
- `NEXTAUTH_URL`: Your Netlify site URL (e.g., `https://your-app.netlify.app`)

**Optional (if using external services):**
- Any API keys or external service credentials

### 4. Deploy
1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at the provided Netlify URL

## Important Notes

- The app is configured with SQLite database (file-based)
- For production, consider using a cloud database (PostgreSQL, MySQL)
- The `@netlify/plugin-nextjs` plugin is included for optimal Next.js support
- Images are set to unoptimized for better Netlify compatibility

## Troubleshooting

- If build fails, check the build logs in Netlify dashboard
- Ensure all environment variables are set correctly
- Verify that your database is accessible from Netlify's servers

## Post-Deployment

1. Test all functionality on the live site
2. Update any hardcoded localhost URLs
3. Configure custom domain if needed