# JR Bridge – Cloudflare Pages

## Deployment type
This project is prepared for **Cloudflare Pages with Git integration**.
The `functions/api/contact.js` endpoint is a Pages Function. Do not use
Cloudflare's drag-and-drop Direct Upload for this package if you need the
contact form to work: Pages Functions require a supported build/deployment
workflow such as Git integration or Wrangler.

## Free plan
Cloudflare Pages has a Free plan. Current documented limits include:
- 500 builds per month
- 1 concurrent build
- 20-minute build timeout
- 20,000 files per site
- 25 MiB maximum individual asset
- up to 100 custom domains per project

Check current limits before production use:
https://developers.cloudflare.com/pages/platform/limits/

## Contact form setup
The form sends requests to `/api/contact`. The Pages Function sends the inquiry
to the configured address through Resend. Configure these as encrypted
environment variables in Cloudflare Pages project settings:

- `RESEND_API_KEY` – API key from Resend
- `CONTACT_TO` – destination mailbox for inquiries
- `CONTACT_FROM` – verified sender, e.g. `JR Bridge <formular@your-domain.cz>`

The sending domain must be verified in Resend. Do not put API keys in HTML or
commit them to Git. Until these values are configured, the form returns a
friendly configuration error and does not silently pretend to send.

## SEO domain switch
The current canonical URL and sitemap/robots URLs still reference the existing
`https://jr-bridge.netlify.app/` address. After Cloudflare Pages project creation
and selection of the final custom domain, update:
- canonical link in `index.html`
- `sitemap.xml` loc entries
- `robots.txt` Sitemap directive
Then submit the final sitemap URL in Google Search Console.

## Deploy
1. Create a private Git repository and upload the contents of this package to its root.
2. In Cloudflare Dashboard, create a Pages project and connect that repository.
3. Framework preset: None; build command: leave empty; output directory: `/` (repository root).
4. Configure the three Resend environment variables.
5. Deploy, test `/api/contact` using the real form, and only then switch the primary domain.
