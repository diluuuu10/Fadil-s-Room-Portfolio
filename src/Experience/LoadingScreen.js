// src/Experience/LoadingScreen.js
// Fullscreen loader overlay that listens to Resources progress + ready.

export default class LoadingScreen {
  constructor(resources) {
    this.resources = resources;

    this.root = document.getElementById("loader");
    this.bar = document.getElementById("loaderBar");
    this.pct = document.getElementById("loaderPct");
    this.hint = document.getElementById("loaderHint");
    this.startBtn = document.getElementById("loaderStart");

    // If markup isn't present, fail silently.
    if (!this.root) return;

    // Prevent accidental clicks through while loading
    this.root.classList.remove("is-done");

    // Default state
    this.setProgress(0);
    this.setHint("Booting RoomOS…");
    this.setStartVisible(false);

    // Wire up progress
    this.resources?.on?.("progress", (e) => {
      const p = Math.max(0, Math.min(1, e?.progress ?? 0));
      this.setProgress(p);
      if (e?.name) this.setHint(`Loading: ${e.name}`);
    });

    // On ready: show "Enter" button
    this.resources?.on?.("ready", () => {
      this.setProgress(1);
      this.setHint("Ready.");
      this.setStartVisible(true);
    });

    // Click / Enter to dismiss
    const dismiss = () => this.dismiss();
    this.startBtn?.addEventListener("click", dismiss);

    window.addEventListener("keydown", (e) => {
      if (this.root.classList.contains("is-done")) return;
      if (e.key === "Enter" || e.key === " ") dismiss();
    });
  }

  setProgress(p) {
    const pct = Math.round(p * 100);
    if (this.bar) this.bar.style.width = `${pct}%`;
    if (this.pct) this.pct.textContent = `${pct}%`;
  }

  setHint(text) {
    if (this.hint) this.hint.textContent = text;
  }

  setStartVisible(visible) {
    if (!this.startBtn) return;
    this.startBtn.classList.toggle("is-hidden", !visible);
    this.startBtn.setAttribute("aria-hidden", visible ? "false" : "true");
    if (visible) this.startBtn.focus();
  }

  dismiss() {
    if (!this.root) return;

    // Only allow dismiss once assets are ready (bar at 100)
    const pct = parseInt(this.pct?.textContent || "0", 10);
    if (Number.isFinite(pct) && pct < 100) return;

    this.root.classList.add("is-done");
    setTimeout(() => this.root?.remove(), 520);
  }
}
