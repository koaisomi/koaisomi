// Builds assets/greeter-dark.svg and assets/greeter-light.svg:
// Jolly's pixel avatar talks while a pixel speech bubble types, with Claude floating beside.
// Sprites live in scripts/sprites/*.json as {w,h,cells:[[x,y,"#hex"]]}.
// Run: node scripts/build-greeter.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Speech bubble lines (max ~38 chars each).
const SAY = [
  "HI, I'M JOLLY.",
  "GOHIGHLEVEL & AI AUTOMATION",
  "WORKFLOW BUILDER. FEEL FREE TO BROWSE.",
];
const ALT = "Hi, I'm Jolly. GoHighLevel & AI Automation Workflow Builder. Feel free to browse.";

const LOOP = 11; // seconds per cycle
const CPS = 0.055; // seconds per typed character
const GAP = 0.35; // pause between lines
const START = 0.6;
const FS = 24; // font size
const CW = FS * 0.6 + 2; // monospace char width incl. letter-spacing
const TX = 456; // text x

const THEMES = {
  dark: { bg: "#0B0D12", panel: "#12151C", line: "#232836", text: "#E8EAF0", a2: "#2DD4BF" },
  light: { bg: "#FAFAF7", panel: "#FFFFFF", line: "#E4E4DE", text: "#14161C", a2: "#0F9F8E" },
};

const sprite = (n) => JSON.parse(readFileSync(new URL(`./sprites/${n}.json`, import.meta.url)));
const JOLLY = sprite("jolly");
const CLAUDE = sprite("claude");

const r = (n) => +n.toFixed(4);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Draw cells as rects, merging horizontal runs of the same colour to keep the file small.
function rects(cells, px, ox = 0, oy = 0) {
  const rows = new Map();
  for (const [x, y, c] of cells) {
    if (!rows.has(y)) rows.set(y, new Map());
    rows.get(y).set(x, c);
  }
  let out = "";
  for (const [y, row] of [...rows].sort((a, b) => a[0] - b[0])) {
    const xs = [...row.keys()].sort((a, b) => a - b);
    for (let i = 0; i < xs.length; ) {
      let j = i;
      while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1 && row.get(xs[j + 1]) === row.get(xs[i])) j++;
      // +0.5 overlap hides hairline seams between neighbouring rects.
      out += `<rect x="${r(ox + xs[i] * px)}" y="${r(oy + y * px)}" width="${r((j - i + 1) * px + 0.5)}" height="${r(px + 0.5)}" fill="${row.get(xs[i])}"/>`;
      i = j + 1;
    }
  }
  return out;
}

// Typing schedule.
let t = START;
const spans = SAY.map((s) => {
  const a = t, b = t + s.length * CPS;
  t = b + GAP;
  return { s, a, b };
});
const typingEnd = spans.at(-1).b;

function typeAnim({ s, a }) {
  const vals = [0], keys = [0];
  for (let k = 1; k <= s.length; k++) {
    vals.push(r(k * CW));
    keys.push(r((a + k * CPS) / LOOP));
  }
  vals.push(0);
  keys.push(0.96);
  return `<animate attributeName="width" dur="${LOOP}s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(";")}" keyTimes="${keys.join(";")}"/>`;
}

// Open-mouth layer flips on/off only while text is typing.
function talkKeyframes() {
  let k = "@keyframes talk{0%{opacity:0}";
  for (const { a, b } of spans) {
    let open = true;
    for (let x = a; x < b; x += 0.13) {
      k += `${r((x / LOOP) * 100)}%{opacity:${open ? 1 : 0}}`;
      open = !open;
    }
    k += `${r((b / LOOP) * 100)}%{opacity:0}`;
  }
  return k + "100%{opacity:0}}";
}

// Pixel bubble with notched corners; stair-step tail points at the avatar's face.
const BUBBLE = [
  [428, 24], [1160, 24], [1160, 32], [1168, 32], [1168, 228], [1160, 228], [1160, 236],
  [428, 236], [428, 228], [420, 228], [420, 108], [410, 108], [410, 100], [400, 100],
  [400, 92], [390, 92], [390, 84], [420, 84], [420, 32], [428, 32],
].map((p) => p.join(",")).join(" ");

// Avatar: 51x51 grid at 4.6 px, bottom-aligned. Mouth sits at row 31, cols 29-31.
const AP = 4.6, AX = 24, AY = 260 - JOLLY.h * AP + 4;
const MOUTH_OPEN = [[29, 32, "#090a09"], [30, 32, "#090a09"], [31, 32, "#090a09"], [30, 33, "#5a2a2a"]];

// Claude: crop to its bounding box; steam = light cells above the cup (rows <= 21, cols <= 13).
const cx0 = Math.min(...CLAUDE.cells.map((c) => c[0]));
const cy0 = Math.min(...CLAUDE.cells.map((c) => c[1]));
const CP = 4.2, CX = 250 - cx0 * CP, CY = 128 - cy0 * CP;
const TILE = "#6A5378"; // avatar backdrop, sampled from the original art
const isSteam = ([x, y]) => y <= 21 && x <= 13;
const claudeBody = CLAUDE.cells.filter((c) => !isSteam(c));
const claudeSteam = CLAUDE.cells.filter(isSteam);

function build(name) {
  const c = THEMES[name];
  const mono = "ui-monospace,SFMono-Regular,'Cascadia Code',Consolas,'Liberation Mono',monospace";
  const clips = spans.map((sp, i) =>
    `<clipPath id="c${i}"><rect x="${TX}" y="${84 + i * 50 - FS - 4}" width="0" height="${FS + 14}">${typeAnim(sp)}</rect></clipPath>`).join("\n");
  const texts = spans.map((sp, i) =>
    `<text x="${TX}" y="${84 + i * 50}" class="say" clip-path="url(#c${i})">${esc(sp.s)}</text>`).join("\n");
  const cursorX = r(TX + spans.at(-1).s.length * CW + 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 260" width="1200" height="260" role="img" aria-label="Pixel art of Jolly talking in a pixel speech bubble, with the Claude mascot floating beside him holding coffee and a laptop: ${esc(ALT).replace(/"/g, "&quot;")}">
<title>Hi from Jolly</title>
<defs>
<clipPath id="frame"><rect width="1200" height="260" rx="20"/></clipPath>
${clips}
<style>
.say{font-family:${mono};font-size:${FS}px;font-weight:700;letter-spacing:2px;fill:${c.text}}
.bob{animation:bob 2.2s steps(1) infinite}@keyframes bob{50%{transform:translateY(${AP}px)}}
.talk{opacity:0;animation:talk ${LOOP}s step-end infinite}
${talkKeyframes()}
.float{animation:float 3.2s ease-in-out infinite alternate}@keyframes float{from{transform:translateY(-6px)}to{transform:translateY(6px)}}
.steam{animation:steam 1.8s steps(4) infinite}@keyframes steam{0%{transform:translateY(${CP}px);opacity:1}100%{transform:translateY(-${CP * 3}px);opacity:0}}
.cur{opacity:0;animation:cur ${LOOP}s steps(1) infinite}
@keyframes cur{0%{opacity:0}${r((typingEnd / LOOP) * 100)}%{opacity:1}96%{opacity:0}}
@media (prefers-reduced-motion:reduce){.bob,.float,.steam,.talk{animation:none}}
</style>
</defs>
<rect width="1200" height="260" rx="20" fill="${c.bg}"/>
<g clip-path="url(#frame)">
  <rect x="18" y="18" width="246" height="262" rx="16" fill="${TILE}"/>
  <g class="bob" shape-rendering="crispEdges">
    ${rects(JOLLY.cells, AP, AX, AY)}
    <g class="talk">${rects(MOUTH_OPEN, AP, AX, AY)}</g>
  </g>
  <g class="float" shape-rendering="crispEdges">
    <g class="steam">${rects(claudeSteam, CP, CX, CY)}</g>
    ${rects(claudeBody, CP, CX, CY)}
  </g>
</g>
<rect x=".5" y=".5" width="1199" height="259" rx="20" fill="none" stroke="${c.line}"/>

<polygon points="${BUBBLE}" fill="${c.panel}" stroke="${c.text}" stroke-width="4" shape-rendering="crispEdges"/>
${texts}
<rect class="cur" x="${cursorX}" y="${84 + (spans.length - 1) * 50 - FS + 2}" width="14" height="${FS}" fill="${c.a2}"/>
</svg>
`;
}

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const t of Object.keys(THEMES)) {
  writeFileSync(new URL(`../assets/greeter-${t}.svg`, import.meta.url), build(t));
  console.log(`assets/greeter-${t}.svg`);
}
