import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { buildLogo } from "./logo3d";
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
list.innerHTML = SKILLS.map((skill) => `<li>${skill.name} (${skill.category})</li>`).join("");

// ---- Renderer, scene, lighting ----
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.NeutralToneMapping; // keeps brand colours true; ACES washes them out
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const BACKGROUND = "#0c0b12";
scene.fog = new THREE.Fog(BACKGROUND, 8, 14);
// A soft studio environment gives the glossy tiles something to reflect.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

scene.add(new THREE.AmbientLight("#ffffff", 0.25));
const key = new THREE.DirectionalLight("#ffffff", 1.4);
key.position.set(1, 3, 6);
scene.add(key);
// Coloured rim lights from either side, matching the site's violet and teal.
const violet = new THREE.PointLight("#a78bfa", 30, 16);
violet.position.set(-5, 1.5, 2);
const teal = new THREE.PointLight("#2dd4bf", 22, 16);
teal.position.set(5, -1.5, 2);
scene.add(violet, teal);

// ---- Logos ----
// Each logo is its own 3D object, extruded from its SVG outline (see logo3d.ts).
// Add ?tiles to the URL to sit each logo on a glossy tile instead of floating free.
const withTiles = params.has("tiles");
const TILE = 1;
const DEPTH = 0.24;
const tileGeometry = new RoundedBoxGeometry(TILE, TILE, DEPTH, 5, 0.18);
const tileMaterial = new THREE.MeshPhysicalMaterial({
  color: "#181430",
  roughness: 0.3,
  metalness: 0.2,
  clearcoat: 0.9,
  clearcoatRoughness: 0.2,
  envMapIntensity: 0.55,
});
// Invisible box around each logo so hovering doesn't need pixel-perfect aim.
const hitGeometry = new THREE.BoxGeometry(TILE, TILE, 0.4);
const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

interface Tile {
  /** Placed on the ring */
  group: THREE.Group;
  /** What moves: sway, bob and hover lift */
  holder: THREE.Group;
  skill: Skill;
  /** Animated hover amount, 0 to 1 */
  lift: number;
}

const tiles: Tile[] = [];
const pickTargets: THREE.Object3D[] = [];

/** Two rings, one above the other, turning in opposite directions. */
const half = Math.ceil(SKILLS.length / 2);
const ringSkills = [SKILLS.slice(0, half), SKILLS.slice(half)];
const RADIUS = (half * TILE * 1.3) / (Math.PI * 2);
const RING_GAP = 0.68;

const rings = ringSkills.map((skills, ringIndex) => {
  const ring = new THREE.Group();
  ring.position.y = ringIndex === 0 ? RING_GAP : -RING_GAP;
  skills.forEach((skill, i) => {
    const angle = (i / skills.length) * Math.PI * 2 + (ringIndex === 1 ? Math.PI / skills.length : 0);
    const group = new THREE.Group();
    group.position.set(Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS);
    group.rotation.y = angle;
    const holder = new THREE.Group();
    group.add(holder);

    const logo = buildLogo(skill, withTiles ? TILE * 0.66 : TILE * 0.82);
    if (withTiles) {
      holder.add(new THREE.Mesh(tileGeometry, tileMaterial));
      logo.geometry.computeBoundingBox();
      logo.position.z = DEPTH / 2 - logo.geometry.boundingBox!.min.z * 0.5;
    }
    holder.add(logo);

    const hit = new THREE.Mesh(hitGeometry, hitMaterial);
    hit.userData.tile = tiles.length;
    holder.add(hit);

    ring.add(group);
    pickTargets.push(hit);
    tiles.push({ group, holder, skill, lift: 0 });
  });
  scene.add(ring);
  return ring;
});

// ---- Sizing: keep both rings in frame at any aspect ratio ----
function resize() {
  const { width, height } = canvas!.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const distance = RADIUS + Math.max(1.75 / Math.tan(halfFov), 2.65 / (Math.tan(halfFov) * camera.aspect));
  camera.position.set(0, 0.55, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  const fog = scene.fog as THREE.Fog;
  fog.near = distance - RADIUS * 0.4;
  fog.far = distance + RADIUS * 1.4;
}
new ResizeObserver(resize).observe(canvas);
resize();

// ---- Interaction: drag to spin, hover a tile to lift it and show its name ----
let spin = 0;
let velocity = 0;
let dragging = false;
let lastX = 0;
let hovered: number | null = null;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(event: PointerEvent) {
  const rect = canvas!.getBoundingClientRect();
  ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickTargets)[0];
  return hit ? (hit.object.userData.tile as number) : null;
}

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
    spin += dx * 0.007;
    velocity = dx * 0.007;
    return;
  }
  hovered = pick(event);
  canvas.style.cursor = hovered === null ? "grab" : "pointer";
});
canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  // A tap (no drag) on touch screens selects the tile under the finger.
  if (Math.abs(velocity) < 0.002) hovered = pick(event);
});
canvas.addEventListener("pointerleave", () => {
  hovered = null;
});
canvas.addEventListener("keydown", (event) => {
  const step = (Math.PI * 2) / half;
  if (event.key === "ArrowLeft") spin += step;
  else if (event.key === "ArrowRight") spin -= step;
  else return;
  hovered = null;
  event.preventDefault();
});

/** The tile on the top ring closest to the viewer right now. */
const world = new THREE.Vector3();
function frontTile() {
  let best = 0;
  let bestZ = -Infinity;
  for (let i = 0; i < ringSkills[0].length; i++) {
    tiles[i].group.getWorldPosition(world);
    if (world.z > bestZ) {
      bestZ = world.z;
      best = i;
    }
  }
  return best;
}

let shown = "";
function updateCaption() {
  const { skill } = tiles[hovered ?? frontTile()];
  const text = `${skill.name} · ${skill.category}`;
  if (text !== shown) {
    shown = text;
    caption!.textContent = text;
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
    spin += velocity;
    velocity *= 0.94;
    if (!reducedMotion && hovered === null && Math.abs(velocity) < 0.001) spin -= dt * 0.22;
  }
  rings[0].rotation.y = spin;
  rings[1].rotation.y = -spin * 0.85;

  tiles.forEach((tile, i) => {
    const target = hovered === i ? 1 : 0;
    tile.lift += (target - tile.lift) * Math.min(1, dt * 10);
    const { holder } = tile;
    holder.scale.setScalar(1 + tile.lift * 0.18);
    // Lift the hovered logo out of the ring towards the viewer.
    const bob = reducedMotion ? 0 : Math.sin(t * 1.1 + i * 0.6) * 0.05;
    holder.position.set(0, bob + tile.lift * 0.08, tile.lift * 0.3);
    // Free-floating logos sway on their own axis, and turn to face you when hovered.
    const sway = reducedMotion || withTiles ? 0 : Math.sin(t * 0.8 + i * 1.3) * 0.5;
    holder.rotation.y = sway * (1 - tile.lift);
  });

  if (!reducedMotion) {
    violet.position.x = -5 + Math.sin(t * 0.4) * 1.2;
    teal.position.x = 5 + Math.cos(t * 0.35) * 1.2;
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
