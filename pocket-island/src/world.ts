import * as THREE from "three";
import type { LandmarkInfo } from "./landmarks";

/** Low-poly building blocks. Everything is made from primitives with flat shading: no model files. */

const material = (color: string, emissive = "#000000") =>
  new THREE.MeshLambertMaterial({ color, emissive, flatShading: true });

const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  return m;
};

/** Things that animate every frame, and things that change with the time of day. */
export interface Animated {
  beacon: THREE.MeshLambertMaterial;
  fire: THREE.Mesh[];
  fireLight: THREE.PointLight;
  controller: THREE.Object3D;
  windows: THREE.MeshLambertMaterial;
  clouds: THREE.Object3D[];
}

export interface World {
  island: THREE.Group;
  landmarks: Map<LandmarkInfo["id"], THREE.Group>;
  animated: Animated;
  sun: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
}

function landmark(id: LandmarkInfo["id"], x: number, z: number, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.userData.landmark = id;
  return group;
}

function tree(x: number, z: number, scale = 1) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5), material("#6b4a2f"), 0, 0.15, 0));
  group.add(mesh(new THREE.ConeGeometry(0.28, 0.6, 6), material("#2f8f5b"), 0, 0.55, 0));
  group.add(mesh(new THREE.ConeGeometry(0.2, 0.45, 6), material("#3aa86b"), 0, 0.85, 0));
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  return group;
}

export function buildWorld(scene: THREE.Scene): World {
  const island = new THREE.Group();
  scene.add(island);

  // Ground: a grassy top over a rocky underside, hanging in the air.
  island.add(mesh(new THREE.CylinderGeometry(3, 2.75, 0.4, 9), material("#58b368"), 0, -0.2, 0));
  island.add(mesh(new THREE.CylinderGeometry(2.75, 2.2, 0.5, 9), material("#8a6a4a"), 0, -0.65, 0));
  const underside = mesh(new THREE.ConeGeometry(2.2, 2.4, 9), material("#6e5440"), 0, -2.1, 0);
  underside.rotation.x = Math.PI;
  island.add(underside);
  const rock = mesh(new THREE.ConeGeometry(0.6, 1.2, 6), material("#5c4636"), 1.1, -2.9, 0.4);
  rock.rotation.x = Math.PI;
  island.add(rock);

  // A dirt path that loosely connects the landmarks.
  const path = mesh(new THREE.RingGeometry(1.15, 1.45, 18), material("#c8b27e"), 0, 0.005, 0);
  path.rotation.x = -Math.PI / 2;
  island.add(path);

  const landmarks = new Map<LandmarkInfo["id"], THREE.Group>();

  // Toronto: the CN Tower, with a blinking light on top.
  const toronto = landmark("toronto", -0.2, -1.6);
  const concrete = material("#d9d4cc");
  toronto.add(mesh(new THREE.CylinderGeometry(0.1, 0.22, 2.4, 6), concrete, 0, 1.2, 0));
  toronto.add(mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.24, 8), material("#b9b3aa"), 0, 1.75, 0));
  toronto.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8), concrete, 0, 2.15, 0));
  toronto.add(mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.9, 5), concrete, 0, 2.65, 0));
  const beacon = material("#ff4d4d", "#ff2222");
  toronto.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), beacon, 0, 3.12, 0));
  landmarks.set("toronto", toronto);

  // Wilfrid Laurier: a little campus hall in purple and gold.
  const laurier = landmark("laurier", -1.7, 0.2, 0.6);
  laurier.add(mesh(new THREE.BoxGeometry(1, 0.6, 0.7), material("#efe6d2"), 0, 0.3, 0));
  const roof = mesh(new THREE.ConeGeometry(0.75, 0.45, 4), material("#5b3b8c"), 0, 0.82, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.75);
  laurier.add(roof);
  laurier.add(mesh(new THREE.BoxGeometry(0.22, 0.32, 0.02), material("#f2b632"), 0, 0.16, 0.36));
  laurier.add(mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), material("#cfc6b2"), -0.42, 0.25, 0.37));
  laurier.add(mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), material("#cfc6b2"), 0.42, 0.25, 0.37));
  landmarks.set("laurier", laurier);

  // GameCraft Camp: a tent and a campfire.
  const camp = landmark("camp", 0.3, 1.75, -0.3);
  const tent = mesh(new THREE.ConeGeometry(0.5, 0.65, 4), material("#f08a3c"), -0.35, 0.32, 0);
  tent.rotation.y = Math.PI / 4;
  camp.add(tent);
  camp.add(mesh(new THREE.BoxGeometry(0.16, 0.3, 0.02), material("#3a2a1e"), -0.35, 0.15, 0.36));
  const log = material("#6b4a2f");
  const logA = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 5), log, 0.45, 0.04, 0.05);
  logA.rotation.z = Math.PI / 2;
  logA.rotation.y = 0.6;
  const logB = logA.clone();
  logB.rotation.y = -0.6;
  camp.add(logA, logB);
  const fire = [
    mesh(new THREE.ConeGeometry(0.09, 0.26, 5), material("#ff9a3c", "#ff6a00"), 0.45, 0.17, 0.05),
    mesh(new THREE.ConeGeometry(0.05, 0.18, 5), material("#ffd23c", "#ffb000"), 0.45, 0.15, 0.05),
  ];
  camp.add(...fire);
  const fireLight = new THREE.PointLight("#ff8a3c", 1.2, 2.5);
  fireLight.position.set(0.45, 0.35, 0.05);
  camp.add(fireLight);
  landmarks.set("camp", camp);

  // Work: an office tower with a grid of windows that light up at night.
  const work = landmark("work", 1.65, -0.3, -0.4);
  work.add(mesh(new THREE.BoxGeometry(0.75, 1.7, 0.75), material("#41506b"), 0, 0.85, 0));
  work.add(mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), material("#34405a"), 0, 1.82, 0));
  const windows = material("#2a3348", "#000000");
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const y = 0.3 + row * 0.28;
      const offset = -0.22 + col * 0.22;
      work.add(mesh(new THREE.BoxGeometry(0.13, 0.15, 0.02), windows, offset, y, 0.385));
      const side = mesh(new THREE.BoxGeometry(0.02, 0.15, 0.13), windows, 0.385, y, offset);
      work.add(side);
    }
  }
  landmarks.set("work", work);

  // Off the clock: a game controller floating over a little pedestal.
  const games = landmark("games", 1.25, 1.3);
  games.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 6), material("#9b8fb8"), 0, 0.1, 0));
  const controller = new THREE.Group();
  const shell = material("#7c3aed");
  controller.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.26), shell, 0, 0, 0));
  controller.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 8), shell, -0.25, 0, 0.04));
  controller.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 8), shell, 0.25, 0, 0.04));
  controller.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), material("#e9e4f5"), -0.17, 0.07, 0));
  controller.add(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.12), material("#e9e4f5"), -0.17, 0.07, 0));
  controller.add(mesh(new THREE.SphereGeometry(0.035, 6, 4), material("#6ee7b7"), 0.15, 0.07, -0.03));
  controller.add(mesh(new THREE.SphereGeometry(0.035, 6, 4), material("#fca5a5"), 0.21, 0.07, 0.03));
  controller.position.y = 0.55;
  controller.rotation.x = 0.35;
  games.add(controller);
  landmarks.set("games", games);

  for (const group of landmarks.values()) island.add(group);

  // Decoration.
  island.add(tree(-1.2, -1.4, 1), tree(-2.3, -0.9, 0.8), tree(-0.9, 2.1, 0.9), tree(2.3, 0.8, 0.75), tree(0.9, -2.3, 0.85));

  const clouds: THREE.Object3D[] = [];
  const cloudMat = material("#ffffff");
  for (const [x, y, z, s] of [
    [-3.6, 1.8, -1, 1],
    [3.4, 2.6, 0.5, 0.8],
    [0.5, 3.3, -3, 0.7],
  ]) {
    const cloud = new THREE.Group();
    cloud.add(mesh(new THREE.IcosahedronGeometry(0.4, 0), cloudMat, 0, 0, 0));
    cloud.add(mesh(new THREE.IcosahedronGeometry(0.3, 0), cloudMat, 0.4, -0.05, 0.05));
    cloud.add(mesh(new THREE.IcosahedronGeometry(0.28, 0), cloudMat, -0.38, -0.08, 0));
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(s);
    scene.add(cloud);
    clouds.push(cloud);
  }

  const ambient = new THREE.HemisphereLight("#dfe8ff", "#4a3b2f", 1.6);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff3dd", 2);
  sun.position.set(4, 6, 3);
  scene.add(sun);

  return {
    island,
    landmarks,
    animated: { beacon, fire, fireLight, controller, windows, clouds },
    sun,
    ambient,
  };
}

/**
 * Light the island for an hour of the day (0-24, Toronto time).
 * Day is warm and bright; night is blue and dim, with lit windows and a brighter fire.
 */
export function setTimeOfDay(world: World, hour: number) {
  // 0 at night, 1 at midday, with soft dawn and dusk.
  const daylight = Math.max(0, Math.min(1, Math.sin(((hour - 6) / 12) * Math.PI) * 1.4));
  const night = 1 - daylight;

  world.sun.intensity = 0.35 + daylight * 1.9;
  world.sun.color.set(daylight < 0.5 ? "#ffb98a" : "#fff3dd").lerp(new THREE.Color("#8fa6ff"), night * 0.6);
  world.ambient.intensity = 1.1 + daylight * 0.6;
  world.ambient.color.set("#dfe8ff").lerp(new THREE.Color("#5b6aa8"), night * 0.55);

  world.animated.windows.emissive.set(night > 0.4 ? "#ffd27a" : "#000000");
  world.animated.windows.color.set(night > 0.4 ? "#ffe2a3" : "#2a3348");
  world.animated.fireLight.intensity = 0.8 + night * 2.2;
}
