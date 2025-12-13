# Deployment Guide

This guide explains how to deploy the cVerse CV Generator application to various static hosting platforms.

## Prerequisites

Before deployment, make sure to:

1. Install dependencies: `npm install`
2. Generate static files: `npm run generate`
3. The deployable files will be in `.output/public` directory

## Deployment Options

### 1. GitHub Pages

```bash
# Build the static site
npm run generate

# Deploy using gh-pages (install if needed: npm install -g gh-pages)
npx gh-pages -d .output/public
```

Or use GitHub Actions workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run generate
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./.output/public
```

### 2. Netlify

**Option A: Using Netlify CLI**

```bash
npm install -g netlify-cli
npm run generate
netlify deploy --prod --dir=.output/public
```

**Option B: Using Netlify UI**

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Netlify dashboard
3. Click "New site from Git"
4. Select your repository
5. Set build settings:
   - Build command: `npm run generate`
   - Publish directory: `.output/public`
6. Deploy!

**netlify.toml** (optional):

```toml
[build]
  command = "npm run generate"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Vercel

**Option A: Using Vercel CLI**

```bash
npm install -g vercel
vercel
```

**Option B: Using Vercel UI**

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Vercel dashboard
3. Click "Import Project"
4. Select your repository
5. Vercel will auto-detect Nuxt.js
6. Deploy!

### 4. Cloudflare Pages

1. Push your code to GitHub/GitLab
2. Go to Cloudflare Pages dashboard
3. Click "Create a project"
4. Select your repository
5. Set build settings:
   - Build command: `npm run generate`
   - Build output directory: `.output/public`
6. Deploy!

### 5. AWS S3 + CloudFront

```bash
# Generate static files
npm run generate

# Upload to S3 (replace YOUR_BUCKET_NAME)
aws s3 sync .output/public s3://YOUR_BUCKET_NAME --delete

# Invalidate CloudFront cache (replace YOUR_DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 6. Self-Hosted (Nginx/Apache)

**Generate files:**
```bash
npm run generate
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/.output/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Apache configuration (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Environment-Specific Notes

### Base URL

If deploying to a subdirectory, update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    baseURL: '/your-subdirectory/'
  }
})
```

### HTTPS

Always use HTTPS in production. Most hosting platforms provide free SSL certificates:
- Netlify: Automatic SSL
- Vercel: Automatic SSL
- Cloudflare Pages: Automatic SSL
- GitHub Pages: Automatic SSL for custom domains

## Post-Deployment Verification

After deployment, verify:

1. ✅ Application loads correctly
2. ✅ Language switching works (EN/FR)
3. ✅ Form inputs save to localStorage
4. ✅ JSON export/import functionality works
5. ✅ PDF generation works
6. ✅ All assets load properly (check browser console)

## Troubleshooting

### Issue: Assets not loading
- Check base URL configuration
- Verify build output directory is correct
- Check browser console for 404 errors

### Issue: localStorage not working
- Ensure site is served over HTTPS or localhost
- Check browser privacy settings

### Issue: PDF not generating
- Check browser console for errors
- Ensure jsPDF library loaded correctly
- Test in different browsers

## Performance Optimization

1. Enable Gzip compression on your server
2. Set appropriate cache headers for static assets
3. Consider using a CDN for global distribution
4. Minimize bundle size with code splitting if needed

## Maintenance

Regular maintenance tasks:
- Keep dependencies updated: `npm update`
- Monitor security vulnerabilities: `npm audit`
- Test in major browsers after updates
- Backup user data export functionality works

## Support

For issues specific to hosting platforms, refer to their documentation:
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
