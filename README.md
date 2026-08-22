# MixWasp

<img width="2652" height="1648" alt="CleanShot 2026-07-29 at 13 33 40@2x" src="https://github.com/user-attachments/assets/958d3718-e0af-4c2e-ba64-f48f2c3ba75e" />


## Discover, favourite, and share the best DJ mixes.

Built with [Wasp](https://wasp.sh) and [Supabase](https://supabase.com)

The aim of this app is both to share great DJ mixes, and to show an example of how you can implement Wasp and Supabase together!

Wasp is used for the core client and server application.

Supabase is used for the database and storage.

### Running locally

1. **Copy the example server env file** (required — most Wasp commands fail env validation without `.env.server`):

```sh
cp .env.server.example .env.server
```

2. **Email for local login (important)**

   This repo defaults to Wasp’s **`Dummy`** email provider in `src/server/emailSender.wasp.ts`. That is how local signup/login works without Resend:

   - No real email is sent.
   - The verification / password-reset message (including the link) is **printed in the `wasp start` server terminal**.
   - Copy that link from the logs to finish verifying your account.

   This is **expected Wasp behaviour**, not a bug: if `provider` is `"Resend"`, Wasp always calls Resend. It will **not** fall back to logging emails when `RESEND_API_KEY` is missing or invalid — you get an API key error instead.

   For production (or if you want real emails locally), set a valid `RESEND_API_KEY` in `.env.server` and switch the provider:

```ts
// src/server/emailSender.wasp.ts
export const emailSender: EmailSender = {
  provider: "Resend", // was "Dummy"
  defaultFrom: {
    name: "MixWasp",
    email: "noreply@mixwasp.com", // must be allowed by your Resend domain
  },
};
```

3. Run the database with `wasp start db` and leave it running.
4. [OPTIONAL]: If this is the first time starting the app, or you've just made changes to your entities/prisma schema, also run `wasp db migrate-dev`.
5. Run `wasp db seed` and select all seed files to get some realistic data in the app to play with.
6. Run `wasp start` and leave it running. This will install the app.

Feel free to contribute by selecting any issue and submitting a PR! If the feature/fix you want to include isn't already in the issues, please raise one before opening a PR. Thanks!

