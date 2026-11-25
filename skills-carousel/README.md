# Skills carousel (work in progress)

The tools I work with, as logos on a slowly turning 3D ring. Drag to spin it, hover a tile for its name, or use the left and right arrow keys.

<!-- TODO(Zohair): add a GIF here -->

## How it's built

- [`src/skills.ts`](src/skills.ts) lists the tools. Logos come from [simple-icons](https://simpleicons.org) (CC0 paths; each logo is its owner's trademark).
- [`src/main.ts`](src/main.ts) draws each logo onto a canvas texture, places the tiles around a ring, and handles drag, hover, keyboard and the animation loop. Fog fades the tiles at the back.

The animation pauses when the canvas is off screen or the tab is hidden, and it doesn't spin or bob with `prefers-reduced-motion` on.

Still to do:

- Microsoft tools I use (Azure, Power BI, Power Automate, Copilot Studio) aren't in simple-icons, so they're missing.
- Click a tile to see where I've used that tool.

## Run it

```bash
npm install
npm run dev     # http://localhost:3005
```

Add `?embed` for a frameless version that fills an iframe. My portfolio uses it.
