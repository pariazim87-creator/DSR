# Daily Study Report — Website package

A responsive, modern-luxury study dashboard prototype built with plain HTML, CSS, and JavaScript.

## Run it
1. Unzip the package.
2. Open `index.html` in a modern browser.
3. For best results, use a simple local web server (for example, VS Code Live Server).

No build step or framework is required. Google Fonts are loaded from the web; the site falls back to system fonts if unavailable.

## Included interactions
- Responsive sidebar and mobile navigation
- Overview, Study Planner, and Reports & Insights views
- Search tasks and filter by status or subject
- Add, complete, sort, and delete study tasks
- Custom daily study goal
- 25-minute focus timer
- End-of-day reflection saved in browser local storage
- Display-name personalization and light/dark appearance toggle
- Subtle transitions and reduced-motion support

## Important: account security
The sign-in screen is a **front-end demo**, not production authentication. It only stores a display name in this browser. It does not create accounts, verify email, hash passwords, sync across devices, or send information to a server. Do not enter a password or sensitive information.

For real user accounts, connect a backend/auth provider (for example, Supabase or Firebase), add server-side authorization and validation, and store user-specific study data in a protected database. Before public launch, also add a privacy policy, account recovery, and appropriate security review.

## Customization
- Colors, typography, layout, and responsive breakpoints: `styles.css`
- Navigation, task interactions, and browser-local preferences: `app.js`
- Page structure and copy: `index.html`
