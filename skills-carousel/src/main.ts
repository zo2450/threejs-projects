import * as THREE from "three";
import { SKILLS, type Skill } from "./skills";
import "./style.css";

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle("embed", params.has("embed"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.querySelector<HTMLCanvasElement>("#carousel");
const caption = document.querySelector<HTMLElement>("#caption");
const list = document.querySelector<HTMLElement>("#skills");
if (!canvas || !caption || !list) throw new Error("Missing page elements");

// Text version for screen readers.
list.innerHTML = SKILLS.map((skill) => `<li>${skill.name}</li>`).join("");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#0c0b12", 6.5, 11);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

// ---- Tiles: one rounded square per skill, logo drawn on a canvas texture ----
const TILE = 1.15;
const RADIUS = (SKILLS.length * TILE * 1.25) / (Math.PI * 2);

/** Very dark brand colours (Next.js, Three.js...) would vanish on a dark tile, so draw those white. */
function logoColour(hex: string) {
  const n = Number.parseInt(hex, 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance < 0.25 ? "#ffffff" : `#${hex}`;
}

function tileTexture(skill: Skill) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const r = 44;
  ctx.beginPath();
  ctx.roundRect(6, 6, size - 12, size - 12, r);
  ctx.fillStyle = "#17142a";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(196, 181, 253, 0.35)";
  ctx.stroke();

  // simple-icons paths are drawn in a 24×24 box.
  const scale = 5.6;
  ctx.save();
  ctx.translate(size / 2 - 12 * scale, size / 2 - 12 * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = logoColour(skill.icon.hex);
  ctx.fill(new Path2D(skill.icon.path));
  ctx.restore();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const ring = new THREE.Group();
scene.add(ring);
const tiles: THREE.Mesh[] = SKILLS.map((skill, i) => {
  const angle = (i / SKILLS.length) * Math.PI * 2;
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE, TILE),
    new THREE.MeshBasicMaterial({ map: tileTexture(skill), transparent: true, side: THREE.DoubleSide }),
  );
  tile.position.set(Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS);
  tile.rotation.y = angle;
  tile.userData.skill = skill;
  tile.userData.angle = angle;
  ring.add(tile);
  return tile;
});

// ---- Sizing ----
function resize() {
  const { width, height } = canvas!.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  // Keep about three tiles across the front, whatever the card's shape.
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const distance = RADIUS + Math.max(1.6 / Math.tan(halfFov), 2.1 / (Math.tan(halfFov) * camera.aspect));
  camera.position.set(0, 0.9, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

// ---- Interaction: drag to spin, hover to name a tile ----
let rotation = 0;
let velocity = 0;
let dragging = false;
let lastX = 0;
let hovered: Skill | null = null;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  velocity = 0;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (dragging) {
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    rotation += dx * 0.008;
    velocity = dx * 0.008;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(tiles)[0];
  hovered = hit ? (hit.object.userData.skill as Skill) : null;
});
canvas.addEventListener("pointerup", () => {
  dragging = false;
});
canvas.addEventListener("pointerleave", () => {
  hovered = null;
});
canvas.addEventListener("keydown", (event) => {
  const step = (Math.PI * 2) / SKILLS.length;
  if (event.key === "ArrowLeft") rotation += step;
  else if (event.key === "ArrowRight") rotation -= step;
  else return;
  event.preventDefault();
});

/** The tile closest to the viewer right now. */
function frontSkill(): Skill {
  let best = tiles[0];
  let bestZ = -Infinity;
  const world = new THREE.Vector3();
  for (const tile of tiles) {
    tile.getWorldPosition(world);
    if (world.z > bestZ) {
      bestZ = world.z;
      best = tile;
    }
  }
  return best.userData.skill as Skill;
}

let shown = "";
function updateCaption() {
  const name = (hovered ?? frontSkill()).name;
  if (name !== shown) {
    shown = name;
    caption!.textContent = name;
  }
}

// ---- Loop (paused off screen or in a background tab) ----
const timer = new THREE.Timer();
let running = false;

function frame() {
  if (!running) return;
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();

  if (!dragging) {
    rotation += velocity;
    velocity *= 0.94;
    if (!reducedMotion && !hovered && Math.abs(velocity) < 0.001) rotation -= dt * 0.25;
  }
  ring.rotation.y = rotation;
  if (!reducedMotion) {
    tiles.forEach((tile, i) => {
      tile.position.y = Math.sin(t * 1.2 + i * 0.7) * 0.06;
    });
  }
  updateCaption();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

let onScreen = true;
function update() {
  const shouldRun = onScreen && !document.hidden;
  if (shouldRun && !running) {
    running = true;
    timer.update();
    requestAnimationFrame(frame);
  } else if (!shouldRun) {
    running = false;
  }
}
new IntersectionObserver(([entry]) => {
  onScreen = entry.isIntersecting;
  update();
}).observe(canvas);
document.addEventListener("visibilitychange", update);
update();
