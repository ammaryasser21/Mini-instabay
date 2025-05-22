#!/bin/bash

echo "Building the application for production..."
npm run build

echo "Deploying to Netlify..."
# If you have Netlify CLI installed, you can uncomment the following line
# netlify deploy --prod

echo "Remember to ensure that your Netlify account is connected to your repository."
echo "For manual deployment, upload the 'dist' folder to Netlify or deploy via the Netlify dashboard."
echo ""
echo "IMPORTANT: Ensure the redirects in netlify.toml are correctly configured:"
echo "- /api/User* redirects to service1.runasp.net"
echo "- /api/Transaction* redirects to service2.runasp.net"
echo "- /api/Report* redirects to service3.runasp.net" 