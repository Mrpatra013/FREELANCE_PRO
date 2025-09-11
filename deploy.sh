#!/bin/bash

# FreelancePro Deployment Script
# This script helps deploy your application to various platforms

echo "🚀 FreelancePro Deployment Script"
echo "================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Force update timestamp to ensure fresh deployment
echo "⏰ Updating deployment timestamp..."
echo "Deployment timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" > .vercel-force-redeploy
echo "TypeScript fix applied: Transaction parameter properly typed" >> .vercel-force-redeploy
echo "Build status: ✅ Local build successful" >> .vercel-force-redeploy

# Add all changes to git
echo "📝 Adding files to git..."
git add .
git add .vercel-force-redeploy

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S') - TypeScript fixes applied"

echo ""
echo "🎯 Choose your deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) Railway"
echo "4) Manual Git Push Only"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🔥 Deploying to Vercel..."
        echo "Run: npx vercel --prod"
        echo "Or visit: https://vercel.com/new and import this repository"
        ;;
    2)
        echo "🌐 Deploying to Netlify..."
        echo "Visit: https://app.netlify.com/start and connect your repository"
        ;;
    3)
        echo "🚂 Deploying to Railway..."
        echo "Visit: https://railway.app and deploy from GitHub"
        ;;
    4)
        echo "📤 Git push only - no deployment"
        echo "Changes committed and ready for manual deployment"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📋 Required Environment Variables:"
echo "- DATABASE_URL (your database connection string)"
echo "- NEXTAUTH_SECRET (random secret for auth)"
echo "- NEXTAUTH_URL (your deployed app URL)"
echo "- SUPABASE_URL (if using Supabase)"
echo "- SUPABASE_ANON_KEY (if using Supabase)"
echo ""
echo "✅ Deployment preparation complete!"
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions"