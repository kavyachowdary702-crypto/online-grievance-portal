# PR draft: feat(frontend): material design UI overhaul — appbar, theme tokens, material components, responsive tables, accessibility improvements

## Summary
Complete Material Design inspired frontend overhaul.

- Added Roboto + Material Icons; global CSS variables for colors and elevation tokens.
- Implemented App Shell and responsive AppBar (`src/components/Navbar.js`) with accessible drawer.
- Added `src/components/MaterialButton.js` and unified button styles across pages.
- Introduced floating-label input pattern (`.md-field`) across major forms (Login, Signup, SubmitComplaint, AnonymousComplaint, modals).
- Converted tables to responsive pattern (`.md-table`) with `data-label` attributes for mobile stacking.
- Accessibility improvements: ARIA attributes, keyboard handlers, visible `:focus-visible` outlines.
- Added `visual-check.js` for headless screenshots and saved snapshots in `frontend/visual-snapshots/`.

## Files changed (high level)
- `src/index.css`
- `src/components/Navbar.js`, `src/components/MaterialButton.js`, `src/components/NotificationCenter.js`, `src/components/AutoEscalationDashboard.js`
- `src/pages/*` (Login, Signup, SubmitComplaint, AnonymousComplaint, Reports, AdminDashboard, OfficerDashboard, MyComplaints)
- `visual-check.js`, `frontend/visual-snapshots/*`

(Exact list: see GitHub's file diff for `feat/material-design-overhaul` branch.)

## Build & QA
- Production build compiled successfully.
  - build/static/js/main.*.js (gzipped): ~157 KB
  - build/static/css/main.*.css (gzipped): ~9.3 KB
- Visual snapshots (generated from `build`):
  - `frontend/visual-snapshots/desktop.png`
  - `frontend/visual-snapshots/tablet.png`
  - `frontend/visual-snapshots/mobile.png`

## Notes for reviewers
- Frontend-only changes; backend untouched. Actuator endpoints are secured (e.g., `/actuator/health` returns 403).
- Accessibility: please validate keyboard flows and focus order across Login, Dashboard, Submit Complaint, Notifications, and menus/drawers.
- Lint: fixed hook dependency warnings (notably `Reports.js` and `NotificationCenter`).
- Dev server: if `3000` is in use, dev server will suggest alternate port (e.g., `3001`).

## Checklist
- [ ] Code follows project style and linters
- [ ] Production build completes (tested)
- [ ] Visual snapshots reviewed and attached to PR
- [ ] Accessibility checks completed (keyboard/ARIA/focus)
- [ ] No backend changes included
- [ ] Ready for merge after review

---

Paste this into the GitHub PR description and attach the three screenshots from `frontend/visual-snapshots/`. If you want, I can also paste this content into the PR page for you (requires a token or manual confirmation to paste), or open the PR page in your browser again.