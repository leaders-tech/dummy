/*
This file tells `npm run icons` how to turn public/icon.svg into favicon and phone home-screen icons.
Edit this file when icon sizes, padding, or the icon background color change.
Do not copy this file. Keep one icon config for the app.
*/

import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Keep this the same as theme_color in vite.config.ts. Phones fill the space around the icon with it.
const iconBackground = "#0e1a2b";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: iconBackground },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: iconBackground },
    },
  },
  images: ["public/icon.svg"],
});
