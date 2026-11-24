# Pocket island

My story so far as a tiny low-poly 3D island. Drag to spin it, tap a place to learn more.

| Place | What it is |
|---|---|
| CN Tower | Toronto: born and raised, still home base |
| Campus hall (purple and gold) | Wilfrid Laurier, Computer Science, class of 2027 |
| Tent and campfire | GameCraft Camp, which I co-founded in 2023 |
| Office tower | Work: Software PM intern at AMD, before that Microsoft and IBM |
| Floating controller | Off the clock: gaming and movies |

The lighting follows the real time in Toronto. At night the office windows light up and the campfire glows brighter. Add `?hour=22` to the URL to preview another time.

<!-- TODO(Zohair): add a GIF here -->

## How it's built

Plain [Three.js](https://threejs.org) and TypeScript, bundled with Vite. There are no 3D model files: everything is built from primitives (boxes, cones, cylinders) with flat shading.

- [`src/world.ts`](src/world.ts) builds the island and landmarks, and sets the lighting for a given hour.
- [`src/landmarks.ts`](src/landmarks.ts) holds the caption for each place.
- [`src/main.ts`](src/main.ts) handles the camera, dragging, picking (raycasting), the animation loop and the Toronto clock.

Details:

- Selecting a place spins the island the short way round until that place faces you.
- The camera distance adapts to the frame's aspect ratio, so the island always fits.
- The animation pauses when the canvas is off screen or the tab is hidden.
- With `prefers-reduced-motion` on, the island doesn't spin, bob or flicker. Dragging and selecting still work.
- Keyboard: focus the scene and use the arrow keys to visit each place, or Escape to deselect. A hidden list gives screen readers the same information.

## Run it

```bash
npm install
npm run dev     # http://localhost:3004
npm run build   # static site in dist/
```

Add `?embed` for a frameless version that fills an iframe. My portfolio uses it.

## License

MIT
