#  keith-effects

Unofficial Node.js wrapper for PhotoFunia image effects.

Apply fun photo effects using image URLs or files — currently supports effects with **1 image and no text**.

## 📦 Install

```bash
npm install keith-effects

🛠️ Usage

const { applyKeithEffect, isValid, listEffects } = require('dreaded-effects');

console.log(listEffects());               // List available effects
console.log(isValid('beach'));            // Check if effect is supported

const result = await applyKeithEffect('beach', 'https://example.com/image.jpg');
console.log(result); // { preview, download }

🔧 Notes

Effects are defined in effects.json

Only supports image-only effects for now (no text input)


📄 License

MIT © 2025 keithkeizzah 
