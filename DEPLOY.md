# Deployment Guide for Mini Instabay

This guide explains how to deploy the Mini Instabay frontend application on Netlify while resolving the mixed content error.

## The Mixed Content Error

When deploying a secure HTTPS website (like Netlify provides) that makes requests to non-secure HTTP APIs, browsers block these requests as "mixed content". The error looks like:

```
Mixed Content: The page was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint. This request has been blocked; the content must be served over HTTPS.
```

## Solution: Proxying API Requests

To solve this issue, we've implemented a proxy solution using Netlify's redirect feature:

1. We've created a `netlify.toml` file that sets up proxies for the various backend services.
2. We've updated the API service files to use relative URLs that will work with the proxy.

## How to Deploy

### 1. Make sure your code includes these files:

- `netlify.toml` - Contains the proxy configuration
- `src/config/api.ts` - Contains the API endpoint configuration using relative URLs
- Updated service files using the API config instead of direct URLs

### 2. Deploy to Netlify

#### Option 1: Using Netlify Dashboard

1. Login to your Netlify account
2. Create a new site from Git
3. Connect to your repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

#### Option 2: Using Netlify CLI

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login to Netlify: `netlify login`
3. Initialize your site: `netlify init`
4. Follow the prompts to set up your site
5. Deploy: `netlify deploy --prod`

### 3. Verify the Proxy Configuration

After deployment, check if the redirects are properly configured:

1. Go to Site settings > Functions > Redirects in your Netlify dashboard
2. You should see the redirects configured in the netlify.toml file:
   - `/api/User*` → `http://service1.runasp.net/api/User:splat`
   - `/api/Transaction*` → `http://service2.runasp.net/api/Transaction:splat`
   - `/api/Report*` → `http://service3.runasp.net/api/Report:splat`

## Troubleshooting

If you're still experiencing mixed content errors:

1. Check the browser console for more specific error messages
2. Verify that all API calls in your code are using the relative URLs (starting with `/api/...`)
3. Test the redirects using the Netlify dev tools: `netlify dev`
4. Check Netlify's function logs to see if the redirects are being processed correctly

## Important Notes

- The proxy solution only works for frontend-backend communication. If there are API-to-API calls happening on the backend, those would need to be handled separately.
- This solution does not actually make the backend APIs secure - it just allows your frontend to communicate with them from a secure context.
- For a production environment, it's always better to have proper HTTPS on your backend APIs. 