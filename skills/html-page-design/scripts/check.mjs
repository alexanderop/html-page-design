#!/usr/bin/env node
// Static lint for a single-file HTML page. No dependencies.
// Usage: node check.mjs page.html [more.html...]
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node check.mjs <page.html> [...]");
  process.exit(2);
}

const GENERIC_TITLES = /^(dashboard|report|page|document|overview|untitled|index|home|explainer|summary)$/i;
const AI_DEFAULT_FONTS = /family=(Inter|Space\+Grotesk)[:&"]/;

function check(html) {
  const errors = [];
  const warnings = [];

  if (!/^\s*<!doctype html>/i.test(html)) errors.push("Missing <!doctype html> at the top.");
  if (!/<meta[^>]+charset/i.test(html)) errors.push("Missing <meta charset>.");
  if (!/<meta[^>]+name="viewport"/i.test(html)) errors.push("Missing viewport meta.");

  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) errors.push("Missing <title>.");
  else {
    if (/\s[—–:-]\s|:\s/.test(title)) warnings.push(`Title "${title}" has an appended explanation. Keep only the name.`);
    if (GENERIC_TITLES.test(title)) warnings.push(`Title "${title}" is a generic category. Name the specific thing.`);
    if (title.split(/\s+/).length > 6) warnings.push(`Title "${title}" is long. Aim for 2–4 words.`);
  }

  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");

  // Tokens: anything defined only inside a dark block is a theme bug.
  const rootBlock = css.match(/(^|\})\s*:root\s*\{([^}]*)\}/)?.[2] ?? "";
  const rootTokens = new Set([...rootBlock.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const allDefined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  for (const t of allDefined) {
    if (!rootTokens.has(t)) errors.push(`Token ${t} is not defined on bare :root (only inside a media or [data-theme] block).`);
  }
  for (const t of used) {
    if (!allDefined.has(t) && !/var\(\s*--[\w-]+\s*,/.test(css)) warnings.push(`Token ${t} is used but never defined.`);
  }

  const hasDarkMedia = /prefers-color-scheme:\s*dark/.test(css);
  const hasDarkAttr = /\[data-theme="dark"\]/.test(css);
  if (hasDarkMedia !== hasDarkAttr) {
    errors.push("Dark theme is half-wired: use both @media (prefers-color-scheme: dark) with :root:not([data-theme=\"light\"]) and :root[data-theme=\"dark\"].");
  }
  if (hasDarkMedia && !/:root:not\(\[data-theme="light"\]\)/.test(css)) {
    warnings.push("Dark media block is not guarded by :root:not([data-theme=\"light\"]).");
  }
  if (!hasDarkMedia && !hasDarkAttr) warnings.push("No dark theme. Fine only if the page commits to one look on purpose.");

  if (!/body\s*\{[^}]*background/.test(css)) errors.push("body does not set an explicit background.");

  // Literal colours outside :root token blocks.
  const outsideTokens = css
    .replace(/:root[^{]*\{[^}]*\}/g, "")
    .replace(/@media\s*\(prefers-color-scheme[^{]*\{\s*[^{]*\{[^}]*\}\s*\}/g, "");
  const literals = outsideTokens.match(/(?<![\w-])#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi) ?? [];
  if (literals.length > 0) {
    warnings.push(`${literals.length} literal colour(s) outside the token blocks, e.g. ${literals.slice(0, 3).join(", ")}. Use tokens.`);
  }

  if (/100vh/.test(css)) warnings.push("Uses 100vh. Prefer height:100% on html/body or size the hero to its content.");
  // Tables, code and diagrams may be wider than a phone inside their own scroll container.
  for (const [, selector, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const px = Number(body.match(/(?:^|;|\s)min-width:\s*(\d+)px/)?.[1] ?? 0);
    if (px > 400 && !/\b(table|pre|code|svg|canvas)\b/.test(selector)) {
      warnings.push(`"${selector.trim()}" sets min-width: ${px}px, wider than a phone.`);
    }
  }
  if (!/prefers-reduced-motion/.test(css) && /(animation|transition)\s*:/.test(css)) {
    warnings.push("Has motion but no prefers-reduced-motion rule.");
  }
  if (/opacity:\s*0\s*;/.test(css) && /IntersectionObserver/.test(html)) {
    warnings.push("Content starts at opacity:0 behind an IntersectionObserver. Make the page complete at rest.");
  }

  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/gi)) {
    const src = m[1];
    if (!/^https?:/.test(src)) continue;
    const pinned = /@\d+\.\d+\.\d+/.test(src) || /\/\d+\.\d+\.\d+\//.test(src);
    if (!pinned) errors.push(`Script not pinned to an exact version: ${src}`);
    if (/@latest|@next/.test(src)) errors.push(`Script uses a moving tag: ${src}`);
  }
  if (/<link[^>]+fonts\.googleapis/.test(html) && !/display=swap/.test(html)) {
    warnings.push("Google Fonts link without display=swap.");
  }
  if (AI_DEFAULT_FONTS.test(html)) warnings.push("Uses Inter or Space Grotesk. Pick a face specific to this subject unless the user asked for it.");
  if (/lorem ipsum/i.test(html)) errors.push("Contains lorem ipsum. Use real content.");
  if (/\b(alert|confirm|prompt)\(/.test(html)) warnings.push("Uses alert/confirm/prompt. Build confirmations into the page.");

  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    if (!/\bid="/.test(m[2]) && !/type="hidden"/.test(m[2])) warnings.push(`<${m[1]}> without a stable id.`);
  }

  return { errors, warnings };
}

let failed = false;
for (const file of files) {
  const { errors, warnings } = check(readFileSync(file, "utf8"));
  console.log(`\n${file}`);
  if (errors.length === 0 && warnings.length === 0) console.log("  ok");
  for (const e of errors) console.log(`  error  ${e}`);
  for (const w of warnings) console.log(`  warn   ${w}`);
  if (errors.length > 0) failed = true;
}
process.exit(failed ? 1 : 0);
