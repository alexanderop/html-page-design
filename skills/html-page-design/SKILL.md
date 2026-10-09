---
name: html-page-design
description: Design and build a self-contained single-file HTML page (report, plan, explainer, dashboard, small tool, landing page, game) that works offline, in light and dark mode, and at phone width. Use when the user asks for an HTML page, a visual write-up, a dashboard, an interactive demo, "make a page for X", "render this as HTML", or "/html-page-design". Writes a local .html file and opens it; nothing is published.
---

# HTML page design

Build one `.html` file that opens straight from disk and looks deliberate. Work like the design lead of a small studio: every page gets real typographic hierarchy, a chosen palette and a considered layout, at the level of treatment the request calls for.

## 1. Decide the treatment

- **Utilitarian** (plan, memo, report, demo, docs): polished type, spacing and palette. No giant hero, few flourishes. This is the default.
- **Editorial** (landing page, game, a tool the user keeps or shares): a distinct visual identity with one deliberate aesthetic risk. See section 7.

When unsure, choose utilitarian. A well-composed page is always acceptable; an over-designed one sometimes is not.

## 2. File contract

- Write a **complete document**: `<!doctype html>`, `<html lang>`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, then `<title>` and one `<style>` block in `<head>`.
- **Location**: the path the user names. Otherwise `./pages/<slug>.html` in the current project, or the session scratchpad when there is no project.
- **Self-contained**: inline all CSS and JS. Embed images as `data:` URIs or reference files next to the page with relative paths. The page must render offline, except for fonts and libraries loaded as below.
- **Fonts**: Google Fonts via `<link>` with `display=swap`, always with a real fallback stack. For a fully offline page, use system stacks instead.
- **Libraries**: only when they do substantial work (charts, syntax highlighting, React). Load the UMD build from cdnjs, jsDelivr or unpkg, pinned to an exact version (`react@18.3.1`, never `react` or `@latest`), placed before the inline script that uses it. Mermaid needs its script here, unlike hosted artifacts.
- **Title**: a name, 2–4 words, specific to the subject. Use the user's own name for the thing when they have one. Never "X: an explainer" or "X — overview"; never a bare category like "Dashboard".
- **Storage**: `localStorage` only for per-viewer conveniences (remembered tab, draft). Wrap every access in try/catch and render correctly without it.
- **Size**: keep it under a few MB. Big data goes in a sibling `.json` loaded with `fetch` only when the page is served over HTTP; for `file://` use, inline it.

## 3. Theme: light and dark, token-based

Viewers have three states: explicit light, explicit dark, or no choice (system). Support all three with this exact shape:

```css
:root {            /* every token, light values */
  --bg: …; --surface: …; --fg: …; --muted: …; --line: …; --accent: …;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: …; --surface: …; --fg: …; --muted: …; --line: …; --accent: …; color-scheme: dark; }
}
:root[data-theme="dark"] { /* same dark values */ color-scheme: dark; }
body { background: var(--bg); color: var(--fg); }
```

Rules:
- Every token is first defined on bare `:root`. The dark blocks only redefine.
- Components use tokens only. No literal colours that work in one theme only, and no component styles inside the media or `[data-theme]` blocks.
- `body` always sets its background.
- Design the dark theme on purpose: keep contrast legible and check the accent on both backgrounds. Do not just invert.
- A deliberately single-look page (neon arcade, letterpress card) may skip dark mode, but still sets every colour explicitly.

Add a small theme toggle only when the page is an app or tool. It sets `document.documentElement.dataset.theme`.

## 4. Fundamentals for every page

**Respect what exists.** Look for a design system first: CLAUDE.md, a tokens/theme file, existing component CSS. Precedence: the user's words, then the project's system, then your choices.

**Ground it in the subject.** Name the subject, the audience and the page's one job. Include at least one detail only this subject has (its real units, its document conventions, its terms of art) as content. Use real content, never lorem ipsum.

**Typography.** Pair a display face with a body face, plus a mono or utility face for data if needed. Set a type scale and keep to it. Running text near 65ch. `text-wrap: balance` on headings, slight letter-spacing on uppercase labels, `font-variant-numeric: tabular-nums` where digits line up.

**Neutrals.** Bias greys slightly toward the accent hue. Pure white or near-black backgrounds are fine when chosen on purpose.

**Layout.**
- Flex/grid with `gap` for sibling spacing, not per-element margins.
- A side gutter of at least 16px, set once on `body` or one wrapper; use `padding-block` for vertical padding so the sides stay.
- Works at 400px: rows wrap or stack. Flex/grid children holding text, code or tables get `min-width: 0`.
- Images and `aspect-ratio` boxes get `max-width: 100%`. Nothing has a `min-width` wider than a phone.
- Only tables, code and diagrams may be wider, each in its own `overflow-x: auto` container. The page never scrolls sideways.
- Fixed bars add `env(safe-area-inset-*)` to their padding. One-screen apps use `height: 100%` on `html, body`, not `100vh`.

**Consistency.** Repeated elements (cards, label/value rows, badges) share edges, baselines and padding. Let content set heights. Pick a column count the items actually fill.

**Cards by role.** Border, fill, radius and shadow mark something as a separate object. Use them on the element that needs separating, not on every block. Big-number tiles only when the numbers are the point.

**Charts.** One scale for marks, ticks and labels; labels only name values the chart reaches. Chart text uses theme tokens. Leave room in the SVG viewBox for outer labels; give every shape an explicit fill.

**Complete at rest.** Everything readable is visible on load; never leave content at `opacity: 0` waiting for a scroll observer. Size a hero to its content, not `100vh`. Tools open in a realistic working state with example data clearly marked as examples.

**Structure is information.** Numbering, eyebrows and dividers must encode something true. Use `01 / 02 / 03` only for a real sequence.

**UI pages (dashboards, tools).** Summary before detail. Show state in form as well as numbers (pill, chip, severity stripe). Semantic colours (good/warn/critical) are separate from the accent. Interactive things look interactive.

**Build cleanly.** Close every element, double-quote attributes, visible keyboard focus, respect `prefers-reduced-motion`, stable `id` on every form control. Use Canvas/WebGL for generative graphics, not long hand-written SVG paths. Watch selector specificity so section and component rules do not cancel each other's spacing.

**Copy.** Write from the reader's side: name things as people know them. Active voice. A button says what happens ("Export CSV"). Errors say what went wrong and how to fix it. Short, plain sentences. No em-dash asides, no "not X, but Y", no "worth noting".

## 5. Avoid the AI-default looks

Unless the user asks for one, do not use:
- warm cream background + serif display + terracotta accent
- near-black with one acid-green or vermilion pop
- broadsheet hairline rules with dense columns
- purple-to-blue gradient hero on white
- Inter or Space Grotesk as the "safe" choice
- emoji as section markers
- everything centred, `rounded-lg` on everything, accent rails on rounded cards

The user's explicit direction always wins, including when it asks for one of these.

## 6. Process

1. **Plan in the file.** Start the `<style>` with a one-line layout comment, 4–6 colour tokens and 2+ font tokens. Do not write the plan into chat; at most one plain sentence about the direction.
2. **Write the page** from those tokens. Start from `assets/starter.html` when it helps.
3. **Lint once:** `node <skill-dir>/scripts/check.mjs <file.html>`. Fix what it reports.
4. **Look once**, if a browser tool exists (`agent-browser`, a browser pane, Playwright): one screenshot at desktop width and one at ~400px in dark mode. Make one pass of fixes. No loops.
5. **Open it** for the user: `open <file>` on macOS, `xdg-open` on Linux. Report the path as a clickable link.

Further polish is for the user to request. If they report something broken, fix it, look once more, and stop.

## 7. Editorial treatment

The client rejected templated proposals and wants a point of view.

- Check the plan against the subject before writing code. Revise any part that would fit any similar page.
- The hero states the thesis: open with the most characteristic thing in the subject's world.
- Typography is the personality. Avoid families you would use on any project; set weights, widths and spacing deliberately.
- One orchestrated motion moment beats scattered effects. Often less is better.
- Put the boldness in one place and keep the rest quiet. If the accent clashes, shift it toward an analogous hue instead of replacing it.
