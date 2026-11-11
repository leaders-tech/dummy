# App Icon Notes

This folder holds the app icon setup. The icon source is one SVG file: `frontend/public/icon.svg`.
`npm run icons` turns it into every icon a browser or phone needs:

- `favicon.ico` — browser tab;
- `apple-touch-icon-180x180.png` — iPhone and iPad home screen;
- `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png` — installed app icons;
- `maskable-icon-512x512.png` — Android home screen (the phone crops it to a circle or rounded square).

All generated files go to `frontend/public/` and are committed to git.

## When the student's app idea becomes clear

The current icon is a template placeholder. As soon as you know what the student's app is about, replace it:

1. Draw a new square `frontend/public/icon.svg` for this app (`viewBox="0 0 512 512"`).
   - Use one simple, bold symbol that matches the app idea. No small text, no thin lines.
   - It must still be readable at 16×16 pixels in a browser tab.
   - Fill the whole square with a background color, and keep the main symbol inside the central circle
     (about 80% of the width). Android crops the edges of the maskable icon.
   - Use plain shapes only: no external fonts, images, or scripts inside the SVG.
2. Put the same background color into `iconBackground` in `icon/pwa-assets.config.ts`.
3. Run `cd frontend && npm run icons`.
4. Update the app identity:
   - `name`, `short_name`, `description`, `theme_color`, and `background_color` in `frontend/vite.config.ts`;
   - `<title>` and `theme-color` in `frontend/index.html`.
5. Open the generated PNG files and check that the symbol is centered and not cut off.
6. Run `make test`, then check the favicon in a live browser tab.

Do not edit the generated PNG or ICO files by hand. Change `icon.svg` and run `npm run icons` again.
