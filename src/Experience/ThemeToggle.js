export default class ThemeToggle {
  constructor(resources) {
    this.resources = resources;
    this.btn = document.getElementById("nightToggle");

    this.isNight = false;
    this.mix = 0; // current [0..1]
    this.target = 0;

    this.duration = 1.5; // seconds
    this.speed = 1 / this.duration;

    this._bind();
  }

  _bind() {
    if (!this.btn) return;

    const toggle = (e) => {
      e.preventDefault();

      this.isNight = !this.isNight;
      this.target = this.isNight ? 1 : 0;

      document.body.classList.toggle("is-night", this.isNight);

      // small feedback
      this.btn.style.transform = "scale(0.95) rotate(-8deg)";
      setTimeout(() => (this.btn.style.transform = ""), 160);
    };

    this.btn.addEventListener("click", toggle, { passive: false });
    this.btn.addEventListener("touchend", toggle, { passive: false });
  }

  update(deltaSeconds) {
    // Smooth approach to target
    const dir = this.target > this.mix ? 1 : -1;
    const step = this.speed * deltaSeconds;

    if (Math.abs(this.target - this.mix) <= step) this.mix = this.target;
    else this.mix += dir * step;

    const pairs = this.resources?.bakedPairs;
    if (!pairs) return;

    for (const p of pairs) {
      p.nightMat.opacity = this.mix;
      p.dayMat.opacity = 1 - this.mix;
    }
  }
}
