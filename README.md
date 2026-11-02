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

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

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
