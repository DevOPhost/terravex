/**
 * ambient.js
 * Efeito visual de fundo: grade de latitude/longitude + partículas flutuantes.
 * Roda num canvas fixo atrás de todo o layout, sem impactar o DOM principal.
 *
 * Autor: Leonardo Farias Martins
 */

(function initAmbient() {

  const canvas = document.getElementById("ambient-canvas");
  const ctx    = canvas.getContext("2d");

  let W = 0, H = 0;
  let particles = [];
  let raf;

  const PARTICLE_COUNT = 55;

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── Partícula ──────────────────────────────────────────── */
  class Particle {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x     = Math.random() * W;
      this.y     = initial ? Math.random() * H : H + 5;
      this.vy    = -(Math.random() * 0.35 + 0.08);
      this.vx    = (Math.random() - 0.5) * 0.2;
      this.r     = Math.random() * 1.2 + 0.3;
      this.alpha = Math.random() * 0.45 + 0.05;
      this.color = Math.random() > 0.55 ? "124,106,247" : "167,139,250";
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -8) this.reset(false);
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  /* ── Grade lat/lon ──────────────────────────────────────── */
  function drawGrid() {
    const LINES_H = 9;   // linhas horizontais (latitudes)
    const LINES_V = 18;  // linhas verticais   (longitudes)

    ctx.strokeStyle = "rgba(124,106,247,0.04)";
    ctx.lineWidth   = 0.8;

    // Horizontais
    for (let i = 0; i <= LINES_H; i++) {
      const y = (H / LINES_H) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Verticais
    for (let j = 0; j <= LINES_V; j++) {
      const x = (W / LINES_V) * j;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Pontos de interseção com leve glow
    ctx.fillStyle = "rgba(124,106,247,0.09)";
    for (let i = 0; i <= LINES_H; i++) {
      for (let j = 0; j <= LINES_V; j++) {
        const x = (W / LINES_V) * j;
        const y = (H / LINES_H) * i;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ── Loop principal ─────────────────────────────────────── */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    for (const p of particles) { p.update(); p.draw(); }
    raf = requestAnimationFrame(loop);
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(true));
    loop();
  }

  window.addEventListener("resize", () => {
    resize();
    cancelAnimationFrame(raf);
    loop();
  });

  // Pausa quando tab está em background (economiza CPU)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else loop();
  });

  init();

})();
