# Skills carousel

The 37 tools from my resume and projects, each logo built as its own 3D object in Three.js, on two rings that turn in opposite directions. Drag to spin, hover (or tap) a logo to bring it forward and see its name and category, or use the left and right arrow keys.

<!-- TODO(Zohair): add a GIF here -->

## How it's built

- [`src/skills.ts`](src/skills.ts) lists the tools by category (Language, Framework, AI, Tool). Logos come from [simple-icons](https://simpleicons.org) (CC0 paths; each logo is its owner's trademark). Tools simple-icons has no logo for (Microsoft's, and VBA) use a [Heroicons](https://heroicons.com) symbol (MIT) in their brand colour instead.
- [`src/logo3d.ts`](src/logo3d.ts) turns each logo into geometry: Three.js's `SVGLoader` reads the SVG outline, `ExtrudeGeometry` gives it depth and a bevelled edge, and it gets a clearcoat material in the brand colour. Very dark logos (Next.js, Three.js, Java) are drawn in silver so they show up on the dark page.
- [`src/main.ts`](src/main.ts) lays the logos out on two rings, lights them with a studio environment map and two coloured rim lights, and handles drag, hover, keyboard and the animation loop. Each logo sways on its own axis; fog fades the back of the rings.

Add `?tiles` to the URL to sit each logo on a glossy rounded tile instead of floating free.

The animation pauses when the canvas is off screen or the tab is hidden. With `prefers-reduced-motion` on, nothing spins, sways or bobs; dragging and the arrow keys still work.

Ideas for later:

- Proper logos for the Microsoft tools.
- Click a logo to see where I've used that tool.

## Run it

```bash
npm install
npm run dev     # http://localhost:3005
```

Add `?embed` for a frameless version that fills an iframe. My portfolio uses it.
