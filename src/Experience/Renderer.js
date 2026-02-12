// src/Experience/Renderer.js
import Experience from "./Experience";
import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

export default class Renderer {
  constructor() {
    this.experience = new Experience();
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    this.setInstance();
  }

  setInstance() {
    // -------- WebGL --------
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.NoToneMapping;

    // If you want a consistent background even if canvas is transparent later
    // this.instance.setClearColor(0x000000, 1);

    // -------- CSS3D (TV iframe) --------
    this.cssTvRenderer = new CSS3DRenderer();
    this.cssTvRenderer.setSize(this.sizes.width, this.sizes.height);
    this.cssTvRenderer.domElement.style.position = "fixed";
    this.cssTvRenderer.domElement.style.inset = "0";
    this.cssTvRenderer.domElement.style.pointerEvents = "none";
    this.cssTvRenderer.domElement.style.zIndex = "10";
    this.cssTvRenderer.domElement.style.background = "transparent";

    // ✅ Append CSS3D dom to container (guarded)
    const container = this.experience.cssTvContainer;
    if (!container) {
      console.error(
        "[Renderer] Missing #css-tv container. Add <div id='css-tv'></div> to index.html " +
          "and set experience.cssTvContainer before new Renderer().",
      );
    } else {
      // Avoid duplicating on HMR reloads
      if (!container.contains(this.cssTvRenderer.domElement)) {
        container.appendChild(this.cssTvRenderer.domElement);
      }
    }
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);

    if (this.cssTvRenderer) {
      this.cssTvRenderer.setSize(this.sizes.width, this.sizes.height);
    }
  }

  update() {
    // ✅ Render WebGL once
    this.instance.render(this.scene, this.camera.instance);

    // ✅ Render CSS TV layer on top
    if (this.cssTvRenderer && this.experience.cssTvScene) {
      this.cssTvRenderer.render(
        this.experience.cssTvScene,
        this.camera.instance,
      );
    }
  }
}
