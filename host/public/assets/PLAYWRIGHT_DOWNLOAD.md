# Playwright Asset Download System

## Overview

The Docker build now includes Playwright for automated browser-based asset downloads. This allows the system to interact with websites that require JavaScript or browser interaction (like Kenney.nl).

## How It Works

1. **Direct Downloads First**: The script tries direct HTTP downloads from known CDN/repository URLs
2. **Browser Automation**: If direct downloads fail, Playwright launches a headless browser to:
   - Navigate to asset pages (e.g., Kenney.nl)
   - Find and click download buttons
   - Handle "continue without donating" pages
   - Save downloaded files automatically
3. **Procedural Fallback**: If all downloads fail, procedural GLTF files are generated

## Current Status

✅ **Playwright is installed and working**
- Chromium browser is installed in Docker
- Script runs during build
- Browser automation is functional

⚠️ **Download Success Rate**
- Direct downloads: Currently failing (URLs may have changed)
- Kenney.nl automation: Struggling to find download buttons (site structure may require different selectors)
- Procedural generation: ✅ Working perfectly as fallback

## Improving Downloads

### Option 1: Fix Kenney.nl Selectors
The Kenney.nl website structure may have changed. To improve:
1. Visit Kenney.nl manually and inspect the download button
2. Update selectors in `download-with-playwright.js`
3. Add screenshots for debugging: `await page.screenshot({ path: 'debug.png' })`

### Option 2: Use Alternative Sources
- **GitHub Repositories**: Many CC0 assets are on GitHub
- **CDN Links**: Some assets have direct CDN links
- **API Endpoints**: Some sites provide API access

### Option 3: Pre-download Assets
- Download assets manually once
- Place in `host/public/assets/` before building
- Docker will use your assets instead of downloading

## Build Process

```bash
docker compose build host
```

During build:
1. Playwright downloads Chromium (~165MB, cached after first build)
2. Script attempts direct downloads
3. If failed, launches browser automation
4. If still failed, generates procedural models
5. Build completes successfully either way

## Troubleshooting

**Downloads failing?**
- Check internet connectivity during build
- Some sites may block automated downloads
- Procedural models will be used (fully functional)

**Playwright errors?**
- Ensure Docker has enough memory (2GB+ recommended)
- Check that system dependencies are installed
- Browser automation requires more resources than simple downloads

**Build taking too long?**
- Playwright browser launch adds ~5-10 seconds per page
- Direct downloads are much faster when they work
- Consider pre-downloading assets for faster builds

## Next Steps

1. **Test with actual Kenney.nl page**: Inspect the current page structure
2. **Add more sources**: Include GitHub repos, CDNs, or APIs
3. **Improve selectors**: Make download button detection more robust
4. **Add retry logic**: Retry failed downloads with exponential backoff

## Current Assets Generated

Even when downloads fail, the system generates:
- `dice.gltf` - Simple cube model
- `character_1.gltf` through `character_4.gltf` - Colored cylinder models

These are valid GLTF files that Three.js can load, ensuring the game always works!
