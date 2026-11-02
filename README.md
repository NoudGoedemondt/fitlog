# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

If `.env` does not exist, copy `.env.example` to `.env` and set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for your development Supabase
project. Keep an existing `.env` unchanged. Environment files are ignored by Git;
only the placeholder example belongs in the repository.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Validate code and formatting

```sh
npm run lint:check
npm run format:check
```

## Vercel deployment

Import this repository into Vercel with the repository root as the Root Directory:

- Framework Preset: **Vite**.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Install Command: `npm ci` (uses the committed `package-lock.json`).
- Node.js version: **24.x**, compatible with `package.json`.

Before building, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the
Vercel project's Environment Variables for each intended environment (Production
and, if used, Preview). Use the public anon key for the selected Supabase project.
Vite embeds `VITE_*` values in the browser bundle: never use a service-role key,
secret key, or database password here. Changes to these variables require a new build.
Keep local development values in your ignored `.env` file.

The router uses `createWebHistory`. `vercel.json` rewrites application paths to
`/index.html` so opening or refreshing routes such as `/weight-logs`,
`/auth/confirm`, and `/reset-password` loads the Vue application.
See [Vercel's Vite deployment documentation](https://vercel.com/docs/frameworks/frontend/vite).

Before testing hosted email confirmation or password recovery, review the
**Hosted Supabase** and **Password recovery** sections below for the Site URL and
allowed callback URLs. Preparing this repository does not change those settings
or deploy the application. After deployment, verify direct navigation and refresh
on nested routes, login, email confirmation, and password recovery on the actual host.

## Email verification

Registration without an immediate session opens `/verify-email`. This page can resend
signup confirmation emails with a 60-second cooldown. The address is passed in browser
history state, not in the URL; users can also enter it directly on the page.

Confirmation links return to `/auth/confirm`. Supabase processes the default email
link and establishes the session; the page checks initialization errors and verifies
the user with Supabase before offering access to the original internal destination.
Invalid or expired links show a recovery action. Login errors for unconfirmed email
addresses also lead to the verification page.

### Local Supabase

`supabase/config.toml` enables email confirmations and allows the callback on localhost
and 127.0.0.1 for ports 5173 and 3000. Restart an already-running local Supabase stack
after changing its configuration. The default Vite URL is `http://localhost:5173`.
Local emails can be inspected in Mailpit at `http://127.0.0.1:54324`.

### Hosted Supabase

Local configuration does not update the hosted project. Configure the following in
the Supabase dashboard before using this flow there:

- Enable **Confirm email** for the email provider.
- Set **Site URL** to the deployed frontend origin.
- Add the deployed callback to **Redirect URLs**, including its return-route query
  string, for example `https://your-app.example/auth/confirm**`. Keep this restricted
  to your actual frontend host and callback path.
- Keep the confirmation email template's `{{ .ConfirmationURL }}` link. This flow
  uses the existing JavaScript client's default implicit flow.
- Configure SMTP for delivery to your intended recipients; the local Mailpit service
  does not send production email.

See the official [password authentication](https://supabase.com/docs/guides/auth/passwords),
[redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), and
[resend](https://supabase.com/docs/reference/javascript/auth-resend) documentation.

## Password recovery

Login links to `/forgot-password`, which calls `resetPasswordForEmail` with a callback
to `/reset-password`. The original internal destination is preserved. Responses do
not disclose whether an address has an account; retries have a 60-second cooldown.
The address and cooldown timestamp are kept in browser history state, not the URL.

The reset page waits for Supabase to process the link, checks initialization errors
and requests the current user from Supabase before showing the password form. Invalid
or expired links show a new-link action, even if an older session exists. A valid
existing authenticated session may also update its own password through this page.
Before saving, the page rechecks that the session still belongs to the same account.
Passwords are submitted with `updateUser`, cleared from the form after success, and
never stored in URLs or browser history state. The reset page remains open when a
recovery session signs in, rather than being redirected away as a guest-only page.

Local callback URLs are included in `supabase/config.toml`. For hosted Supabase, add
`https://your-app.example/reset-password**` to **Redirect URLs**, restricted to your
actual frontend host. Keep the reset email template's `{{ .ConfirmationURL }}` link
and configure SMTP for production delivery. Use Mailpit locally to test delivery.

See [password reset requests](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
and [updating a password](https://supabase.com/docs/reference/javascript/auth-updateuser).
