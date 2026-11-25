// Builds assets/banner-dark.svg and assets/banner-light.svg.
// Run: node scripts/build-banner.mjs
import { writeFileSync, mkdirSync } from "node:fs";

// Terminal rows: [tag, project, status]. Shown one by one, then the loop restarts.
// TODO(human): pick the 4-6 rows that tell your story (what's live, public, building).
// "running"/"building" render amber; anything else renders green. Keep project names <= 18 chars.
const LINES = [
  ["hq", "ground-zero-hq", "live"],
  ["ext", "job-fit-scorer", "public"],
  ["ext", "capture-to-post", "shipped"],
  ["bot", "maps-lead-scraper", "running"],
  ["app", "maxim-desktop", "building"],
];

const LOOP = 12; // seconds per cycle
const STEP = 1.3; // seconds between rows
const FIRST = 0.8; // first row delay

const THEMES = {
  dark: {
    bg: "#0B0D12", panel: "#12151C", line: "#232836", text: "#E8EAF0", muted: "#8A90A2",
    dim: "#5B6274", a1: "#8B7CF6", a2: "#2DD4BF", ok: "#34D399", warn: "#FBBF24",
  },
  light: {
    bg: "#FAFAF7", panel: "#FFFFFF", line: "#E4E4DE", text: "#14161C", muted: "#5D6372",
    dim: "#9AA0AE", a1: "#6D5AE6", a2: "#0F9F8E", ok: "#059669", warn: "#B45309",
  },
};

const pct = (s) => ((s / LOOP) * 100).toFixed(2);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function statusColor(status, c) {
  return status === "building" || status === "running" ? c.warn : c.ok;
}

function build(name) {
  const c = THEMES[name];
  const mono = "ui-monospace,SFMono-Regular,'Cascadia Code',Consolas,'Liberation Mono',monospace";
  const sans = "'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";

  // Per-row keyframes: row appears at t, status flips 0.6 s later, all fade at 94%.
  let kf = "";
  let rows = "";
  LINES.forEach(([tag, proj, status], i) => {
    const t = FIRST + i * STEP;
    const s = t + 0.6;
    kf += `@keyframes ln${i}{0%,${pct(t)}%{opacity:0;transform:translateX(-6px)}${pct(t + 0.25)}%,94%{opacity:1;transform:none}100%{opacity:0}}`;
    kf += `@keyframes st${i}{0%,${pct(s)}%{opacity:0}${pct(s + 0.15)}%,94%{opacity:1}100%{opacity:0}}`;
    kf += `@keyframes wt${i}{0%,${pct(t)}%{opacity:0}${pct(t + 0.2)}%,${pct(s)}%{opacity:1}${pct(s + 0.1)}%,100%{opacity:0}}`;
    const y = 160 + i * 34;
    rows += `<g class="ln" style="animation-name:ln${i}">
  <text x="772" y="${y}" class="m" fill="${c.dim}">${esc(tag)}</text>
  <text x="822" y="${y}" class="m" fill="${c.text}">${esc(proj)}</text>
</g>
<text x="1116" y="${y}" class="m st" text-anchor="end" fill="${c.dim}" style="animation-name:wt${i}">...</text>
<text x="1116" y="${y}" class="m st" text-anchor="end" fill="${statusColor(status, c)}" style="animation-name:st${i}">${esc(status)}</text>\n`;
  });
  const barEnd = FIRST + LINES.length * STEP;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400" role="img" aria-label="Koaisomi - AI automations, built to run themselves. Jolly Reil Luna, AI Automation Engineer and Systems Architect.">
<title>Koaisomi - Jolly Reil Luna</title>
<defs>
<linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${c.a1}"/><stop offset="0.5" stop-color="${c.a2}"/><stop offset="1" stop-color="${c.a1}"/>
  <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;0 0" dur="6s" repeatCount="indefinite"/>
</linearGradient>
<linearGradient id="acc2" gradientUnits="userSpaceOnUse" x1="750" y1="0" x2="1140" y2="0">
  <stop offset="0" stop-color="${c.a1}"/><stop offset="1" stop-color="${c.a2}"/>
</linearGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${c.line}"/></pattern>
<radialGradient id="glow" cx="0.85" cy="0.2" r="0.6"><stop offset="0" stop-color="${c.a1}" stop-opacity="0.18"/><stop offset="1" stop-color="${c.a1}" stop-opacity="0"/></radialGradient>
<style>
.m{font-family:${mono};font-size:15px}
.s{font-family:${sans}}
.up{opacity:0;animation:up .9s cubic-bezier(.2,.7,.2,1) forwards}
.d1{animation-delay:.1s}.d2{animation-delay:.3s}.d3{animation-delay:.5s}.d4{animation-delay:.7s}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ln,.st{opacity:0;animation-duration:${LOOP}s;animation-iteration-count:infinite;animation-timing-function:ease-out}
${kf}
.bar{transform-box:fill-box;transform-origin:left center;animation:bar ${LOOP}s linear infinite}
@keyframes bar{0%{transform:scaleX(0)}${pct(barEnd)}%,94%{transform:scaleX(1)}100%{transform:scaleX(0)}}
.blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2s ease-out infinite}
@keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;opacity:1!important;transform:none!important}.wt{display:none}}
</style>
</defs>
<rect width="1200" height="400" rx="20" fill="${c.bg}"/>
<rect width="1200" height="400" rx="20" fill="url(#dots)" opacity=".6"/>
<rect width="1200" height="400" rx="20" fill="url(#glow)"/>
<rect x=".5" y=".5" width="1199" height="399" rx="20" fill="none" stroke="${c.line}"/>

<g class="up d1">
  <circle cx="66" cy="96" r="5" fill="${c.ok}"/><circle class="pulse" cx="66" cy="96" r="5" fill="${c.ok}"/>
  <text x="82" y="101" class="m" font-size="13" letter-spacing="2" fill="${c.muted}">KOAISOMI  /  PHILIPPINES  /  UTC+8</text>
</g>
<text x="60" y="180" class="s up d2" font-size="50" font-weight="700" fill="${c.text}" letter-spacing="-1">AI automations,</text>
<text x="60" y="240" class="s up d3" font-size="50" font-weight="700" fill="${c.text}" letter-spacing="-1">built to <tspan fill="url(#acc)">run themselves.</tspan></text>
<text x="62" y="292" class="s up d4" font-size="18" fill="${c.muted}">Jolly Reil Luna  ·  AI Automation Engineer  ·  Systems Architect</text>

<g class="up d3">
  <rect x="750" y="76" width="390" height="268" rx="14" fill="${c.panel}" stroke="${c.line}"/>
  <circle cx="772" cy="100" r="5" fill="${c.line}"/><circle cx="790" cy="100" r="5" fill="${c.line}"/><circle cx="808" cy="100" r="5" fill="${c.line}"/>
  <text x="830" y="105" class="m" font-size="13" fill="${c.muted}">maxim.log</text>
  <text x="1116" y="105" class="m" font-size="13" text-anchor="end" fill="${c.ok}">● agents on</text>
  <rect x="750" y="121" width="390" height="2" fill="${c.line}"/>
  <rect class="bar" x="750" y="121" width="390" height="2" fill="url(#acc2)"/>
${rows}
  <text x="772" y="${160 + LINES.length * 34}" class="m" fill="${c.a2}">&gt; <tspan fill="${c.muted}">next build</tspan> <tspan class="blink" fill="${c.text}">▌</tspan></text>
</g>
</svg>
`;
}

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const t of Object.keys(THEMES)) {
  writeFileSync(new URL(`../assets/banner-${t}.svg`, import.meta.url), build(t));
  console.log(`assets/banner-${t}.svg`);
}
