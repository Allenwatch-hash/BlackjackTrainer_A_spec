# Hosted PWA deployment and device QA

## Deployment

- Provider: GitHub Pages (free)
- Expected URL: <https://allenwatch-hash.github.io/BlackjackTrainer_A_spec/>
- Vite base path: `/BlackjackTrainer_A_spec/`
- Workflow: `.github/workflows/deploy-pages.yml`, deploying `main`
- Status: pending publication; the workflow must be merged to `main` and Pages must be enabled for GitHub Actions before a live deployment can be verified.

## iPhone Add to Home Screen test

Do not mark this test passed until it has been run on a physical iPhone against the hosted URL.

- Device model: pending
- iOS version: pending
- Hosted URL opened in Safari: pending
- Added to Home Screen using Safari Share → Add to Home Screen: pending
- App opens from the Home Screen in standalone mode: pending
- Drill accepts an answer and advances to another hand: pending
- Reload starts a fresh run and does not restore saved progress: pending
- Cheat sheet opens and closes: pending
- Incorrect answer shows feedback and the cheat sheet highlights the correct cell: pending
