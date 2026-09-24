# Xteon Engineering & Interaction Guidelines

## 1. Cross-Platform Desktop Webview Invariants (WebKit & Chromium)
- **Engine Awareness**: Windows runs Chromium (WebView2); macOS and Linux run WebKit (WKWebView). Never assume Chromium-only feature availability or behavior.
- **Vite Compilation Target**: Maintain Vite `target` for non-Windows platforms at `safari16` or newer to ensure modern syntax support for Zustand v5, React Flow v12, and ES2022+ features.
- **Global CSS Imports**: Import third-party component stylesheets (e.g. `@xyflow/react/dist/style.css`) at the root stylesheet (`src/index.css`) rather than inside dynamically evaluated or component-level files to prevent WebKit module graph stalls.
- **Root ErrorBoundary Protection**: Ensure the root webview entrypoint (`src/main.tsx`) remains wrapped in a robust `ErrorBoundary` that renders error details and a reload trigger, preventing silent blank-screen unmounts.

## 2. User Interaction Protocols
- **Strict Execution Holds**: When the user specifies "no execution", "just tell me", or requests discussion/analysis, do not propose or execute any code edits, file creation, or background commands. Provide full analytical and diagnostic insights first, and wait for explicit confirmation before proceeding.
- **Diagnostic Differentiation**: When investigating visual issues in the app, always distinguish between intentional empty states (e.g., blank canvas with active navbar) and unmounted DOM crashes (blank background color with no UI chrome).
