// Builds assets/greeter-dark.svg and assets/greeter-light.svg:
// an original cartoon that waves and "talks" while a pixel speech bubble types a greeting.
// Run: node scripts/build-greeter.mjs
import { writeFileSync, mkdirSync } from "node:fs";

// Speech bubble lines (max ~32 chars each, uppercase reads best in the pixel bubble).
const SAY = [
  "HI, I'M JOLLY. THE CARTOON ONE.",
  "I BUILD AI AGENTS THAT HANDLE",
  "THE BUSY WORK. SEE BELOW.",
];

const LOOP = 10; // seconds per cycle
const CPS = 0.055; // seconds per typed character
const GAP = 0.35; // pause between lines
const START = 0.6;
const FS = 24; // font size
const CW = FS * 0.6 + 2; // monospace char width incl. letter-spacing

const THEMES = {
  dark: { bg: "#0B0D12", panel: "#12151C", line: "#232836", text: "#E8EAF0", a1: "#8B7CF6", a2: "#2DD4BF" },
  light: { bg: "#FAFAF7", panel: "#FFFFFF", line: "#E4E4DE", text: "#14161C", a1: "#6D5AE6", a2: "#0F9F8E" },
};
const SKIN = "#E3A97F", HAIR = "#1E1A22", EYE = "#1E1A22";

const r = (n) => +n.toFixed(4);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Work out when each line starts and ends typing.
let t = START;
const spans = SAY.map((s) => {
  const a = t, b = t + s.length * CPS;
  t = b + GAP;
  return { s, a, b };
});
const typingEnd = spans.at(-1).b;

// Discrete clip-width animation: one step per character, then hold, then reset.
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

// Mouth flaps open/closed only while text is typing.
function talkKeyframes() {
  let k = "@keyframes talk{0%{transform:scaleY(.3)}";
  let open = true;
  for (const { a, b } of spans) {
    for (let x = a; x < b; x += 0.12) {
      k += `${r((x / LOOP) * 100)}%{transform:scaleY(${open ? 1 : 0.3})}`;
      open = !open;
    }
    k += `${r((b / LOOP) * 100)}%{transform:scaleY(.3)}`;
    open = true;
  }
  return k + "100%{transform:scaleY(.3)}}";
}

// Pixel bubble outline with notched corners and a stair-step tail pointing at the face.
const BUBBLE = [
  [312, 30], [1160, 30], [1160, 38], [1168, 38], [1168, 222], [1160, 222], [1160, 230],
  [312, 230], [312, 222], [304, 222], [304, 150], [294, 150], [294, 142], [284, 142],
  [284, 134], [274, 134], [274, 126], [304, 126], [304, 38], [312, 38],
].map((p) => p.join(",")).join(" ");

function build(name) {
  const c = THEMES[name];
  const mono = "ui-monospace,SFMono-Regular,'Cascadia Code',Consolas,'Liberation Mono',monospace";
  const clips = spans.map((sp, i) => {
    const y = 88 + i * 50;
    return `<clipPath id="c${i}"><rect x="340" y="${y - FS - 4}" width="0" height="${FS + 14}">${typeAnim(sp)}</rect></clipPath>`;
  }).join("\n");
  const texts = spans.map((sp, i) =>
    `<text x="340" y="${88 + i * 50}" class="say" clip-path="url(#c${i})">${esc(sp.s)}</text>`).join("\n");
  const cursorX = r(340 + spans.at(-1).s.length * CW + 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 260" width="1200" height="260" role="img" aria-label="A cartoon of Jolly waving in a headset, talking in a pixel speech bubble: ${SAY.join(" ").replace(/"/g, "")}">
<title>Hi from Jolly</title>
<defs>
${clips}
<style>
.say{font-family:${mono};font-size:${FS}px;font-weight:700;letter-spacing:2px;fill:${c.text}}
.arm{transform-origin:206px 206px;animation:wave 1.4s ease-in-out infinite alternate}
@keyframes wave{from{transform:rotate(-10deg)}to{transform:rotate(16deg)}}
.eye{transform-box:fill-box;transform-origin:center;animation:blink 4s infinite}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
.mouth{transform-box:fill-box;transform-origin:center;animation:talk ${LOOP}s linear infinite}
${talkKeyframes()}
.bob{animation:bob 3s ease-in-out infinite}@keyframes bob{50%{transform:translateY(3px)}}
.cur{animation:cur 1s steps(1) infinite}@keyframes cur{50%{opacity:0}}
.curw{opacity:0;animation:curw ${LOOP}s steps(1) infinite}
@keyframes curw{0%{opacity:0}${r((typingEnd / LOOP) * 100)}%{opacity:1}96%{opacity:0}}
@media (prefers-reduced-motion:reduce){.arm,.eye,.mouth,.bob,.cur{animation:none}}
</style>
</defs>
<rect width="1200" height="260" rx="20" fill="${c.bg}"/>
<rect x=".5" y=".5" width="1199" height="259" rx="20" fill="none" stroke="${c.line}"/>

<g class="bob">
  <!-- waving arm (behind body) -->
  <g class="arm">
    <path d="M206 206 L246 128" stroke="${c.a1}" stroke-width="24" stroke-linecap="round"/>
    <circle cx="250" cy="120" r="14" fill="${SKIN}"/>
  </g>
  <!-- hoodie -->
  <path d="M82 262 Q86 206 120 196 L180 196 Q214 206 218 262 Z" fill="${c.a1}"/>
  <path d="M136 196 L150 222 L164 196 Z" fill="${c.bg}" opacity=".35"/>
  <rect x="140" y="172" width="20" height="26" rx="6" fill="${SKIN}"/>
  <!-- head -->
  <circle cx="150" cy="128" r="48" fill="${SKIN}"/>
  <path d="M100 126 Q96 74 150 72 Q206 74 200 126 Q192 98 162 96 Q156 108 132 104 Q112 108 100 126 Z" fill="${HAIR}"/>
  <!-- headset -->
  <path d="M100 128 Q100 66 150 66 Q200 66 200 128" fill="none" stroke="${c.a2}" stroke-width="6"/>
  <rect x="92" y="118" width="14" height="26" rx="6" fill="${c.a2}"/>
  <rect x="194" y="118" width="14" height="26" rx="6" fill="${c.a2}"/>
  <path d="M100 142 Q104 168 132 166" fill="none" stroke="${c.a2}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="134" cy="166" r="4" fill="${c.a2}"/>
  <!-- face -->
  <ellipse class="eye" cx="133" cy="130" rx="5" ry="6" fill="${EYE}"/>
  <ellipse class="eye" cx="167" cy="130" rx="5" ry="6" fill="${EYE}"/>
  <circle cx="124" cy="148" r="7" fill="#F28B82" opacity=".35"/>
  <circle cx="176" cy="148" r="7" fill="#F28B82" opacity=".35"/>
  <ellipse class="mouth" cx="152" cy="154" rx="9" ry="7" fill="#7A2E2E"/>
</g>

<polygon points="${BUBBLE}" fill="${c.panel}" stroke="${c.text}" stroke-width="4" shape-rendering="crispEdges"/>
${texts}
<rect class="curw" x="${cursorX}" y="${88 + (spans.length - 1) * 50 - FS + 2}" width="14" height="${FS}" fill="${c.a2}"><animate attributeName="opacity" values="1;0" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect>
</svg>
`;
}

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const t of Object.keys(THEMES)) {
  writeFileSync(new URL(`../assets/greeter-${t}.svg`, import.meta.url), build(t));
  console.log(`assets/greeter-${t}.svg`);
}
