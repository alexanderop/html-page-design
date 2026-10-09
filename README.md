# html-page-design

A Claude Code plugin that teaches Claude to design and build self-contained, single-file HTML pages: reports, plans, explainers, dashboards, small tools, landing pages.

It is a local take on the design guidance Claude Code uses for claude.ai Artifacts, rewritten so it needs no claude.ai account and no publishing step. Claude writes an `.html` file to disk and opens it in your browser.

## What you get

- `skills/html-page-design/SKILL.md`: the design rules (treatment levels, theme tokens, layout, typography, anti-AI-default looks, process).
- `skills/html-page-design/assets/starter.html`: a minimal page that already follows the rules (tokens, light/dark, gutters, focus, reduced motion).
- `skills/html-page-design/scripts/check.mjs`: a zero-dependency lint for a finished page (title, theme wiring, body background, literal colours, unpinned scripts, `100vh`, lorem ipsum, and more).

## Install

From a local clone:

```bash
claude plugin marketplace add ~/Projects/active/html-page-design
```

```bash
claude plugin install html-page-design@html-page-design
```

From GitHub (private repo works when `gh` or git can already reach it):

```bash
claude plugin marketplace add alexanderop/html-page-design
```

Then ask for a page ("make an HTML page that explains our deploy pipeline") or call `/html-page-design:html-page-design`.

## Use the lint by hand

```bash
node skills/html-page-design/scripts/check.mjs path/to/page.html
```

Exit code is 1 when there are errors; warnings do not fail.

## Customise

- **Your own look**: edit the tokens in `assets/starter.html` and add a line to section 4 of `SKILL.md` such as "Default to the tokens in assets/starter.html unless the project has its own system."
- **Output folder**: change the location rule in section 2.
- **Banned looks**: edit the list in section 5.
- **Lint rules**: each check in `check.mjs` is a few lines; delete or add freely.

After editing, run `claude plugin marketplace update html-page-design` (or restart Claude Code) to pick up changes.
