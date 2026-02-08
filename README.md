# Claw Babalala

A neon mini-game for the "AI Zoo" universe. Glide through a glitchy space-zoo, gobble energy orbs, and dodge chaos cubes. Built with vanilla HTML/CSS/JS so it runs anywhere.

## Play locally

```bash
# clone the repo (already here if you're reading locally)
cd claw-babalala
python3 -m http.server 5173
# visit http://localhost:5173
```

Any static server works — Vercel, GitHub Pages, Netlify, etc. The game code is entirely client-side.

## Controls

- `←` / `→` or `A` / `D` — move left/right
- `Space` — dash (brief invulnerability + bonus points)
- Pointer/touch drag — steer directly (mobile friendly)
- Tap/click — trigger dash

Keep your combo streak alive by chaining orb pickups without crashing. Dashing through orbs doubles their value for 2 seconds.

## File structure

```
├── index.html      # layout + HUD
├── style.css       # neon UI styling
└── game.js         # gameplay loop, physics, rendering
```

## Roadmap ideas

- Leaderboard backed by Supabase/Firestore
- Additional enemy families + powerups
- Audio + haptics toggle
- Localization (zh-TW copy exists in channel collateral)

PRs welcome!
