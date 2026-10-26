# Kubecart Frontend Agent Rules

These rules apply to every coding session in this repository.

## Source of Truth

- Read `FRONTEND_GUIDE.md` before implementing API integration.
- Inspect relevant files in `frontend_ref/` before UI work.
- Treat the reference HTML, CSS, and assets as the visual source of truth.
- Inspect the existing repository and preserve useful work.
- Never guess API endpoints, fields, status values, or undocumented behavior.
- Record discrepancies and blockers in `progress.md`.

## Technology Stack

- JavaScript and JSX only. No TypeScript.
- Use React, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, and Lucide React.
- Keep dependencies minimal and compatible.
- Do not change package managers or replace lockfiles without a clear reason.

## Design

- Match the reference typography, colors, spacing, layouts, borders, shadows, radii, image treatment, and responsive breakpoints.
- The admin dashboard must share the storefront's visual language.
- Use focused components and reusable patterns. Avoid giant components and unnecessary abstractions.
- Support mobile, tablet, and desktop.
- Use semantic HTML, accessible labels, keyboard navigation, and visible focus states.
- Do not create controls that look functional but do nothing.

## API and State

- Use only documented or verified endpoints and payloads.
- Centralize API requests and error handling.
- Use TanStack Query for remote/server state and Zustand for shared client state.
- Use stable query keys and deliberate invalidation.
- Provide loading, empty, success, and error states.
- Do not present mock data as live API data.
- Do not make unsupported backend features appear functional.

## Security and Payments

- The backend is authoritative for prices, inventory, fees, totals, and payment status.
- Never mark an order paid based only on a redirect or URL parameter. Verify through the documented backend endpoint.
- Never collect or store card details.
- Follow documented admin authentication and CSRF requirements.
- Never expose or commit secrets. `VITE_*` variables are public browser configuration.
- Do not weaken authentication, CORS, or validation to bypass integration problems.
- Do not log tokens, credentials, payment data, or signed image URLs.
- Handle expired sessions and authorization failures explicitly.

## Image Performance

- Give images stable dimensions or aspect ratios to prevent layout shifts.
- Lazy-load below-the-fold images and non-critical thumbnails.
- Prioritize the main LCP image when appropriate.
- Use asynchronous decoding, appropriate object-fit, placeholders, and error fallbacks.
- Reuse available assets and avoid loading unnecessarily large images into small thumbnails.
- Signed URLs may expire. Follow the guide and avoid infinite retries.
- Never guess public-storage URLs or construct arbitrary `srcset` URLs from signed URLs.
- Never expose storage credentials or introduce an unapproved frontend image proxy.

## Code Quality

- Keep changes focused and avoid unrelated refactors.
- Do not delete or overwrite `frontend_ref/` or user work.
- Do not reset, force-push, or discard existing changes.
- Do not commit unless explicitly asked.
- Run relevant checks after meaningful milestones and fix regressions.
- Never claim tests, builds, or manual checks passed unless they were actually run.

## Progress Tracking

- Keep `progress.md` current.
- Before each milestone, record its goal and acceptance criteria.
- After each milestone, record completed work, files changed, commands run, actual results, blockers, and next steps.
- Mark tasks complete only after verification.
- Separate backend limitations from frontend bugs.
