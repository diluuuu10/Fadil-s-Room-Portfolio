import Sizes from "./Utilts/Sizes";
import Time from "./Utilts/Time";
import * as THREE from "three";
import Camera from "./Camera";
import Renderer from "./Renderer";
import World from "./World";
import Resources from "./Utilts/Resource";
import sources from "./sources";
import ThemeToggle from "./ThemeToggle";

let instance = null;

export default class Experience {
  constructor(canvas) {
    if (instance) return instance;
    instance = this;

    window.experience = this;

    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();

    // WebGL scene
    this.scene = new THREE.Scene();

    // CSS layer container (for TV / PC iframes etc)
    this.cssTvContainer = document.getElementById("css-tv");
    this.cssTvScene = new THREE.Scene();

    this.camera = new Camera();
    this.renderer = new Renderer();

    // Resources
    this.resources = new Resources(sources);

    // Theme toggle created AFTER resources are ready
    this.themeToggle = null;
    this.resources.on("ready", () => {
      this.themeToggle = new ThemeToggle(this.resources);
    });

    // World
    this.world = new World();

    this.sizes.on("resize", () => {
      this.resize();
    });

    this.time.on("tick", () => {
      this.update();
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    // Time.delta is usually ms -> convert to seconds
    const dt = (this.time?.delta ?? 16) * 0.001;

    this.camera.update();

    // ✅ keep World animations/logic running if it has one
    if (this.world?.update) this.world.update();

    // ✅ theme blending
    if (this.themeToggle) this.themeToggle.update(dt);

    // ✅ camera navigation lerp
    if (this.world?.navigation) this.world.navigation.update();

    // ✅ CSS3D screens
    if (this.world?.tvIframe) this.world.tvIframe.update();
    if (this.world?.pcIframe) this.world.pcIframe.update();

    this.renderer.update();
  }
}
