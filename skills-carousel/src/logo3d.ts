import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import type { Skill } from "./skills";

const loader = new SVGLoader();

/** Very dark brand colours (Next.js, Three.js, Java...) would vanish on the dark page, so make those silver. */
function brandColour(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance < 0.28 ? "#e7e4f2" : hex.startsWith("#") ? hex : `#${hex}`;
}

/** SVG markup for a skill: its simple-icons logo, or its fallback symbol. */
function svgFor(skill: Skill) {
  if (skill.icon) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${skill.icon.path}"/></svg>`;
  }
  // Heroicons fill with currentColor, which the loader can't parse; the colour comes from the material anyway.
  return (skill.symbol ?? "").replaceAll("currentColor", "#ffffff");
}

/**
 * Builds a skill's logo as a real 3D object: the SVG outline is turned into shapes and extruded
 * with a bevelled edge, in the brand colour. Returns a mesh centred on the origin, `size` units
 * across its longest side, facing +z.
 */
export function buildLogo(skill: Skill, size: number) {
  const data = loader.parse(svgFor(skill));
  const shapes = data.paths.flatMap((path) => path.toShapes());

  // Logos are drawn in a 24-unit box; these depths are in the same units.
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 3.2,
    bevelEnabled: true,
    bevelThickness: 0.7,
    bevelSize: 0.28,
    bevelSegments: 4,
    curveSegments: 12,
  });
  // SVG's y axis points down. Mirroring y and z together keeps the faces' winding (and lighting) correct.
  geometry.scale(1, -1, -1);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const centre = box.getCenter(new THREE.Vector3());
  geometry.translate(-centre.x, -centre.y, -centre.z);
  const extent = box.getSize(new THREE.Vector3());
  const scale = size / Math.max(extent.x, extent.y);
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();

  const colour = brandColour(skill.icon ? skill.icon.hex : (skill.colour ?? "#c4b5fd"));
  const material = new THREE.MeshPhysicalMaterial({
    color: colour,
    metalness: 0.05,
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    envMapIntensity: 0.6,
  });
  return new THREE.Mesh(geometry, material);
}
