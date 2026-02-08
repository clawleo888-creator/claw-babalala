const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const resetBtn = document.getElementById('reset');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let state;

const INPUT = {
  left: false,
  right: false,
  dash: false,
};

const listeners = [];

function initState() {
  return {
    hero: {
      x: WIDTH / 2,
      y: HEIGHT - 140,
      radius: 28,
      vx: 0,
      dashTimer: 0,
      dashCooldown: 0,
    },
    score: 0,
    combo: 1,
    comboTimer: 0,
    time: 0,
    orbs: [],
    cubes: [],
    particles: [],
    alive: true,
  };
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnOrb() {
  state.orbs.push({
    x: rand(30, WIDTH - 30),
    y: -20,
    radius: rand(10, 16),
    speed: rand(90, 150),
    glow: rand(0.6, 1),
  });
}

function spawnCube() {
  state.cubes.push({
    x: rand(30, WIDTH - 30),
    y: -30,
    size: rand(26, 36),
    speed: rand(140, 200),
    wobble: Math.random() * Math.PI * 2,
  });
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x,
      y,
      vx: rand(-80, 80),
      vy: rand(-100, -20),
      life: rand(0.4, 0.8),
      color,
    });
  }
}

function update(dt) {
  const hero = state.hero;
  state.time += dt;

  const targetVx = (INPUT.left ? -1 : 0) + (INPUT.right ? 1 : 0);
  hero.vx += (targetVx * 240 - hero.vx) * 6 * dt;
  hero.x += hero.vx * dt;
  hero.x = Math.max(hero.radius, Math.min(WIDTH - hero.radius, hero.x));

  if (hero.dashCooldown > 0) hero.dashCooldown -= dt;
  if (hero.dashTimer > 0) hero.dashTimer -= dt;

  if (INPUT.dash && hero.dashCooldown <= 0) {
    hero.dashTimer = 0.2;
    hero.dashCooldown = 1.2;
    spawnParticles(hero.x, hero.y + 10, 'rgba(255,101,216,0.8)');
  }

  if (hero.dashTimer > 0) {
    hero.y -= 240 * dt;
    hero.y = Math.max(HEIGHT * 0.3, hero.y);
  } else {
    hero.y += 160 * dt;
    hero.y = Math.min(HEIGHT - 100, hero.y);
  }

  if (state.time % 0.9 < dt) spawnOrb();
  if (state.time % 1.6 < dt) spawnCube();

  state.orbs = state.orbs.filter((orb) => {
    orb.y += orb.speed * dt;
    if (orb.y - orb.radius > HEIGHT) return false;
    const dx = orb.x - hero.x;
    const dy = orb.y - hero.y;
    const dist = Math.hypot(dx, dy);
    if (dist < hero.radius + orb.radius) {
      const value = hero.dashTimer > 0 ? 20 : 10;
      state.score += value * state.combo;
      state.combo = Math.min(state.combo + 0.25, 5);
      state.comboTimer = 2.5;
      spawnParticles(orb.x, orb.y, 'rgba(91,255,176,0.9)');
      return false;
    }
    return true;
  });

  state.cubes = state.cubes.filter((cube) => {
    cube.y += cube.speed * dt;
    cube.x += Math.sin(state.time * 3 + cube.wobble) * 30 * dt;
    if (cube.y - cube.size > HEIGHT) return false;
    const dx = cube.x - hero.x;
    const dy = cube.y - hero.y;
    const dist = Math.hypot(dx, dy);
    if (dist < hero.radius + cube.size * 0.6) {
      state.alive = false;
      spawnParticles(hero.x, hero.y, 'rgba(255,65,65,0.8)');
    }
    return true;
  });

  state.particles = state.particles.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    return true;
  });

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 1;
  }

  scoreEl.textContent = Math.floor(state.score).toLocaleString();
  comboEl.textContent = `${state.combo.toFixed(1)}x`;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, '#050b16');
  grad.addColorStop(1, '#090012');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (HEIGHT / 6) * i + (state.time * 40) % (HEIGHT / 6));
    ctx.lineTo(WIDTH, (HEIGHT / 6) * i + (state.time * 40) % (HEIGHT / 6));
    ctx.stroke();
  }

  state.orbs.forEach((orb) => {
    const orbGrad = ctx.createRadialGradient(
      orb.x,
      orb.y,
      0,
      orb.x,
      orb.y,
      orb.radius * 2
    );
    orbGrad.addColorStop(0, `rgba(91,255,176,${0.8 * orb.glow})`);
    orbGrad.addColorStop(1, 'rgba(91,255,176,0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5bffb0';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  state.cubes.forEach((cube) => {
    ctx.save();
    ctx.translate(cube.x, cube.y);
    ctx.rotate(Math.sin(state.time * 2) * 0.3);
    ctx.fillStyle = 'rgba(255,101,216,0.2)';
    ctx.fillRect(-cube.size, -cube.size, cube.size * 2, cube.size * 2);
    ctx.strokeStyle = 'rgba(255,101,216,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-cube.size, -cube.size, cube.size * 2, cube.size * 2);
    ctx.restore();
  });

  state.particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  const hero = state.hero;
  const bodyGrad = ctx.createRadialGradient(hero.x, hero.y, 10, hero.x, hero.y, 40);
  bodyGrad.addColorStop(0, '#ffe66d');
  bodyGrad.addColorStop(1, '#ff65d8');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#09111f';
  ctx.beginPath();
  ctx.arc(hero.x - 10, hero.y - 5, 5, 0, Math.PI * 2);
  ctx.arc(hero.x + 10, hero.y - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  if (!state.alive) {
    ctx.fillStyle = 'rgba(5,6,11,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('System Crash!', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '20px Space Grotesk, sans-serif';
    ctx.fillText('Press reset to reboot', WIDTH / 2, HEIGHT / 2 + 18);
  }
}

let last = 0;
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;
  if (state.alive) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function bindInput() {
  function handleKey(e, down) {
    if (e.key === 'ArrowLeft' || e.key === 'a') INPUT.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') INPUT.right = down;
    if (e.key === ' ' || e.key === 'Spacebar') INPUT.dash = down;
  }
  const keydown = (e) => handleKey(e, true);
  const keyup = (e) => handleKey(e, false);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  listeners.push(['keydown', keydown]);
  listeners.push(['keyup', keyup]);

  let pointerId = null;
  const pointerDown = (e) => {
    pointerId = e.pointerId;
    INPUT.dash = true;
  };
  const pointerMove = (e) => {
    if (pointerId !== e.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    state.hero.x = x;
  };
  const pointerUp = () => {
    INPUT.dash = false;
    pointerId = null;
  };
  canvas.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  listeners.push(['pointerdown', pointerDown]);
  listeners.push(['pointermove', pointerMove]);
  listeners.push(['pointerup', pointerUp]);
}

function unbindInput() {
  listeners.forEach(([event, handler]) => {
    window.removeEventListener(event, handler);
    canvas.removeEventListener(event, handler);
  });
  listeners.length = 0;
}

function resetGame() {
  state = initState();
  scoreEl.textContent = '0';
  comboEl.textContent = '1x';
}

resetBtn.addEventListener('click', () => {
  resetGame();
});

bindInput();
resetGame();
requestAnimationFrame(loop);
