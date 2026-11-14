# Store Operations App

## Project context

- This is a React 19 and Vite application, with Capacitor for Android builds.
- The primary source code is in `src/`; Android-specific files are in `android/`.
- Keep credentials and service configuration out of source control. Do not expose
  or modify `.env.local` unless the user explicitly asks.
- Treat generated output in `dist/` as build output; change source files instead.

## Working agreements

- Prefer focused, minimal changes that preserve the current app behavior.
- Before adding or upgrading dependencies, explain why and ask for confirmation.
- Run `npm run lint` after JavaScript or React changes when feasible.
- Run `npm run build` when a change affects the production bundle or build setup.
- Ask before destructive data changes, publishing, deployments, or modifying
  external services such as Supabase.
