# PWA Icons Placeholder

This directory contains PWA icons and assets. In production, you would generate proper icons using tools like:

- PWA Asset Generator
- Favicon Generator
- App Icon Generator

For now, these are placeholders that should be replaced with actual icon files:

## Required Icons:

- `/public/pwa-192x192.png` - 192x192 icon
- `/public/pwa-512x512.png` - 512x512 icon
- `/public/apple-touch-icon.png` - 180x180 Apple touch icon
- `/public/favicon.ico` - Standard favicon

## Splash Screens:

- Various Apple splash screen sizes for different devices

## Generate Icons:

You can use online tools like:

1. https://www.pwabuilder.com/imageGenerator
2. https://realfavicongenerator.net/
3. https://favicon.io/

Or use CLI tools:

```bash
npx pwa-asset-generator logo.svg public --index index.html --manifest public/manifest.json
```
