import * as THREE from "three";
import { LANDMARKS, type LandmarkInfo } from "./landmarks";
import { buildWorld, setTimeOfDay } from "./world";
import "./style.css";

type Id = LandmarkInfo["id"];

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle("embed", params.has("embed"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.querySelector<HTMLCanvasElement>("#island");
const caption = document.querySelector<HTMLElement>("#caption");
const list = document.querySelector<HTMLElement>("#places");
if (!canvas || !caption || !list) throw new Error("Missing page elements");

// A text version of the island for screen readers.
list.innerHTML = LANDMARKS.map((place) => `<li><strong>${place.title}.</strong> ${place.line}</li>`).join("");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const world = buildWorld(scene);

// ---- Time of day: follows the real time in Toronto (or ?hour=0-23 for testing) ----
const torontoHour = () => {
  if (params.has("hour")) return Number(params.get("hour"));
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") + get("minute") / 60;
};
const updateTime = () => setTimeOfDay(world, torontoHour());
updateTime();
setInterval(updateTime, 60_000);

// ---- Sizing: keep the whole island in frame at any aspect ratio ----
function resize() {
  const { width, height } = canvas!.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const distance = Math.max(4 / Math.tan(halfFov), 3.6 / (Math.tan(halfFov) * camera.aspect));
  camera.position.set(0, distance * 0.42, distance).normalize().multiplyScalar(distance);
  camera.lookAt(0, 0.25, 0);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

// ---- Interaction ----
let yaw = 0.4;
let velocity = 0;
let targetYaw: number | null = null;
let dragging = false;
let moved = 0;
let lastX = 0;
let hovered: Id | null = null;
let selected: Id | null = null;

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(event: PointerEvent): Id | null {
  const rect = canvas!.getBoundingClientRect();
  ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects([...world.landmarks.values()], true)) {
    let node: THREE.Object3D | null = hit.object;
    while (node && !node.userData.landmark) node = node.parent;
    if (node) return node.userData.landmark as Id;
  }
  return null;
}

function showCaption(id: Id | null) {
  const place = LANDMARKS.find((item) => item.id === id);
  caption!.innerHTML = place
    ? `<strong>${place.title}</strong> ${place.line}`
    : "Drag to spin. Tap a place to learn more.";
}

/** Select a landmark and turn the island so it faces the viewer. */
function select(id: Id | null) {
  selected = id;
  showCaption(id);
  if (!id) {
    targetYaw = null;
    return;
  }
  const { x, z } = world.landmarks.get(id)!.position;
  const facing = -Math.atan2(x, z);
  // Take the short way round.
  targetYaw = yaw + Math.atan2(Math.sin(facing - yaw), Math.cos(facing - yaw));
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  moved = 0;
  lastX = event.clientX;
  velocity = 0;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (dragging) {
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    moved += Math.abs(dx);
    if (moved > 4) {
      targetYaw = null;
      yaw += dx * 0.01;
      velocity = dx * 0.01;
    }
    return;
  }
  hovered = pick(event);
  canvas.style.cursor = hovered ? "pointer" : "grab";
  if (!selected) showCaption(hovered);
});

canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  if (moved <= 4) select(pick(event));
});

canvas.addEventListener("pointerleave", () => {
  hovered = null;
  if (!selected) showCaption(null);
});

canvas.addEventListener("keydown", (event) => {
  const index = LANDMARKS.findIndex((item) => item.id === selected);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    select(LANDMARKS[(index + 1) % LANDMARKS.length].id);
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    select(LANDMARKS[(index - 1 + LANDMARKS.length) % LANDMARKS.length].id);
  } else if (event.key === "Escape") {
    select(null);
  } else {
    return;
  }
  event.preventDefault();
});

showCaption(null);

// ---- Animation loop (paused when off screen or in a background tab) ----
const timer = new THREE.Timer();
let running = false;

function frame() {
  if (!running) return;
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = timer.getElapsed();

  if (targetYaw !== null) {
    yaw += (targetYaw - yaw) * Math.min(1, dt * 5);
  } else if (!dragging) {
    yaw += velocity;
    velocity *= 0.92;
    if (!selected && !reducedMotion && Math.abs(velocity) < 0.001) yaw += dt * 0.15;
  }
  world.island.rotation.y = yaw;

  const active = hovered ?? selected;
  for (const [id, group] of world.landmarks) {
    const goal = id === active ? 1.12 : 1;
    group.scale.setScalar(group.scale.x + (goal - group.scale.x) * Math.min(1, dt * 10));
  }

  if (!reducedMotion) {
    world.island.position.y = Math.sin(t * 0.8) * 0.06;
    world.animated.beacon.emissiveIntensity = Math.sin(t * 3) > 0 ? 1 : 0.15;
    world.animated.fire.forEach((flame, i) => {
      flame.scale.y = 1 + Math.sin(t * 12 + i * 2) * 0.18;
    });
    world.animated.fireLight.distance = 2.5 + Math.sin(t * 10) * 0.2;
    world.animated.controller.position.y = 0.55 + Math.sin(t * 2) * 0.06;
    world.animated.controller.rotation.y = Math.sin(t * 0.9) * 0.4;
    world.animated.clouds.forEach((cloud, i) => {
      cloud.position.x += Math.sin(t * 0.2 + i) * dt * 0.08;
    });
  }

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
