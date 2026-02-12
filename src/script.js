import Experience from "./Experience/Experience";
import LoadingScreen from "./Experience/LoadingScreen";

const experience = new Experience(document.querySelector("canvas.webgl"));

// Loading screen (listens to resources progress)
new LoadingScreen(experience.resources);

// ------------------------------
// Navbar bindings
// ------------------------------
const aboutBtn = document.getElementById("navAbout");
const shopBtn = document.getElementById("navShop");
const resetBtn = document.getElementById("resetCam");

// Navigation exists only after resources are ready (World is created then)
experience.resources.on("ready", () => {
  const nav = experience.world?.navigation;
  if (!nav) return;

  const clickFx = (el) => {
    if (!el) return;
    el.style.transform = "scale(0.96)";
    setTimeout(() => (el.style.transform = ""), 120);
  };

  aboutBtn?.addEventListener("click", () => {
    clickFx(aboutBtn);
    nav.focusTV();
  });

  shopBtn?.addEventListener("click", () => {
    clickFx(shopBtn);
    nav.focusComputer();
  });

  const setResetVisible = (visible) => {
    if (!resetBtn) return;
    resetBtn.classList.toggle("is-hidden", !visible);
  };

  resetBtn?.addEventListener("click", () => {
    clickFx(resetBtn);
    nav.exitStage();
  });

  const sync = () => {
    // ✅ show ONLY when fully focused
    setResetVisible(nav.state === "focused");
    requestAnimationFrame(sync);
  };

  sync();
});
