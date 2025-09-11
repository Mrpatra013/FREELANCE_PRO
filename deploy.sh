#!/bin/bash

# FreelancePro Deployment Script
# This script helps you deploy your application quickly

echo "🚀 FreelancePro Deployment Helper"
echo "================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files to git
echo "📦 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy FreelancePro with Supabase integration"
fi
git commit -m "$commit_msg"

# Check if remote origin exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote origin already configured"
    echo "🔄 Pushing to existing repository..."
    git push origin main || git push origin master
else
    echo "⚠️  No remote repository configured"
    echo ""
    echo "Please follow these steps:"
    echo "1. Create a new repository on GitHub/GitLab/Bitbucket"
    echo "2. Copy the repository URL"
    echo "3. Run: git remote add origin <your-repo-url>"
    echo "4. Run: git push -u origin main"
    echo ""
    echo "Then choose your deployment platform:"
fi

echo ""
echo "🌐 Deployment Options:"
echo "====================="
echo ""
echo "1. Vercel (Recommended for Next.js):"
echo "   • Go to https://vercel.com"
echo "   • Import your GitHub repository"
echo "   • Add environment variables from your .env file"
echo "   • Deploy!"
echo ""
echo "2. Netlify:"
echo "   • Go to https://netlify.com"
echo "   • Drag & drop your project or connect Git"
echo "   • Add environment variables"
echo "   • Deploy!"
echo ""
echo "3. Railway:"
echo "   • Go to https://railway.app"
echo "   • Deploy from GitHub repo"
echo "   • Add environment variables"
echo "   • Deploy!"
echo ""
echo "📋 Environment Variables to Add:"
echo "================================"
echo "DATABASE_URL=postgresql://postgres:mbi@26092005@db.vqogcptblupsspjqurtn.supabase.co:5432/postgres"
echo "NEXT_PUBLIC_SUPABASE_URL=https://vqogcptblupsspjqurtn.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb2djcHRibHVwc3NwanF1cnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NzU4NTMsImV4cCI6MjA3MzE1MTg1M30.pLIj8bsNV7aoj2V-w9Rouh7cN9lS-OLiYo0n-mfoOBo"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb2djcHRibHVwc3NwanF1cnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU3NTg1MywiZXhwIjoyMDczMTUxODUzfQ.IRaOaaBBIHKlfOx8yrJT3l3b_NvVweL-72bqfg__TWw"
echo "NEXTAUTH_SECRET=your-random-secret-here"
echo "NEXTAUTH_URL=https://your-app-domain.com"
echo ""
echo "🎉 Your app is ready for deployment!"
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions"