// Ambient decorations (floating stars, slow spins, the hello hand, the status
// dot, the sabor sparks) pause while they are off screen: an endless CSS
// animation keeps the frame pipeline running even where nobody can see it.
const AMBIENT = '.float-a, .float-b, .float-c, .spin-slow, .wave, .animate-pulse, .sabor';

export function initIdle(): void {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-offscreen', !e.isIntersecting);
  });
  document.querySelectorAll(AMBIENT).forEach((el) => io.observe(el));
}
