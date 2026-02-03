# WaveSpeed Batch Web App (Netlify)

This project serves a static HTML page and uses Netlify Functions to call WaveSpeed securely (API key stays on the server).

## 1) What you get

- `index.html` — simple UI to paste up to 20 prompts
- `netlify/functions/submit.js` — creates tasks on WaveSpeed
- `netlify/functions/status.js` — checks task status + outputs

## 2) Deploy to Netlify

1. Push this folder to a Git repo and connect it in Netlify.
2. In Netlify **Site settings → Environment variables**, add:
   - `WAVESPEED_API_KEY` = your API key
   - `WAVESPEED_MODEL` = `bytedance/seedance-v1-lite-t2v-720p` (optional)
3. Deploy.

## 3) Local testing (optional)

Netlify functions run only via Netlify. If you want to test locally, install Netlify CLI and use:

```bash
npm i -g netlify-cli
netlify dev
```

## Notes

- Do **not** put API keys into `index.html`.
- The page submits prompts to `/api/submit` and polls `/api/status` every 5 seconds.
- Limit is 20 prompts per batch (can be changed in `netlify/functions/submit.js`).
