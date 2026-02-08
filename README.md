# Claw Babalala

This repo now houses two different browser games:

1. **Claw Babalala** — neon orbital dodger (vanilla HTML/CSS/JS)
2. **Metal Blitz** — Phaser 3 side-scrolling run-and-gun prototype inspired by arcade classics

## 1. Claw Babalala

Glide through a glitchy space-zoo, gobble energy orbs, and dodge chaos cubes. Built with vanilla HTML/CSS/JS so it runs anywhere.

### Play locally

```bash
cd claw-babalala
python3 -m http.server 5173
# visit http://localhost:5173
```

Any static server works — Vercel, GitHub Pages, Netlify, etc. The game code is entirely client-side.

### Controls

- `←` / `→` or `A` / `D` — move left/right
- `Space` — dash (brief invulnerability + bonus points)
- Pointer/touch drag — steer directly (mobile friendly)
- Tap/click — trigger dash

Keep your combo streak alive by chaining orb pickups without crashing. Dashing through orbs doubles their value for 2 seconds.

### File structure

```
├── index.html      # layout + HUD
├── style.css       # neon UI styling
└── game.js         # gameplay loop, physics, rendering
```

### Roadmap ideas

- Leaderboard backed by Supabase/Firestore
- Additional enemy families + powerups
- Audio + haptics toggle
- Localization (zh-TW copy exists in channel collateral)

## 2. Metal Blitz

A Phaser 3 prototype that recreates the pacing of classic run-and-gun shooters: multi-weapon hero moves through parallax battlefields, fights grunt waves and mini mechs, and chains combos for score.

### Play locally

```bash
cd claw-babalala/metal-blitz
python3 -m http.server 5180
# visit http://localhost:5180
```

Any static server or Vite/serve plugin will work; the build is pure client-side assets.

### Core Features

- Arcade movement: run, jump, dash, rifle autofire, rockets, grenades
- Enemy director spawns grunt waves + a miniboss mech
- Basic pickups (HP) and combo-based scoring
- Code-generated placeholder sprites so you can drop in real art later

### Controls

- `A / D` or `← / →` — move
- `Space / W / ↑` — jump
- `Shift` — dash burst (short cooldown)
- `J` — rifle autofire
- `K` — rockets
- `L` — grenades (arc + area damage)

### Next steps

Replace textures with actual sprite sheets, connect a proper tilemap, add audio/hitstop, and expand enemy roster.

PRs welcome!
