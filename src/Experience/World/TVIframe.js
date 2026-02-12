// src/Experience/World/TVIframe.js
import * as THREE from "three";
import Experience from "../Experience.js";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

export default class TVIframe {
  constructor({ roomModel, navigation }) {
    this.experience = new Experience();
    this.roomModel = roomModel;
    this.navigation = navigation;

    this.camera = this.experience.camera.instance;
    this.canvas = this.experience.canvas;

    this.cssScene = this.experience.cssTvScene;
    this.cssContainer = this.experience.cssTvContainer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.tvScreenMesh = null;
    this.cssObj = null;

    // ----------------------------
    // ✅ KEEPING YOUR TWEAK VALUES EXACTLY
    // ----------------------------
    this.tweak = {
      pxPerMeter: 7.6,
      offsetX: -9.7,
      offsetY: -3.1,
      push: -2.8,
      normalFlip: false,

      rotX: 0.0,
      rotY: 0.9,
      rotZ: 0.03,
    };
    // ----------------------------

    this._onMouseMove = (e) => {
      const rect = this.canvas?.getBoundingClientRect?.();
      if (rect) {
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.mouse.set(x, y);
      } else {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.mouse.set(x, y);
      }
    };

    window.addEventListener("pointermove", this._onMouseMove);

    if (this.cssContainer) this.cssContainer.style.pointerEvents = "none";

    this.findTvMeshes();
    if (this.tvScreenMesh) this.createIframe();
  }

  findTvMeshes() {
    this.roomModel.traverse((child) => {
      if (child?.isMesh && child.name === "TV_Screen") {
        this.tvScreenMesh = child;
      }
    });

    if (!this.tvScreenMesh) {
      console.warn(
        "[TVIframe] TV_Screen mesh not found. Check your GLB names.",
      );
    }
  }

  createIframe() {
    // 1) Create iframe DOM
    const wrapper = document.createElement("div");
    wrapper.style.width = "1024px";
    wrapper.style.height = "576px";
    wrapper.style.pointerEvents = "auto";
    wrapper.style.background = "transparent";

    const iframe = document.createElement("iframe");
    iframe.src = "/tv-ps2/index.html";
    iframe.allow = "autoplay; clipboard-write";
    iframe.style.width = "1024px";
    iframe.style.height = "576px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "18px";
    iframe.style.background = "transparent";

    wrapper.appendChild(iframe);

    // 2) Wrap into CSS3DObject
    const cssObj = new CSS3DObject(wrapper);
    cssObj.visible = false;

    // 3) Screen box + orientation
    const box = new THREE.Box3().setFromObject(this.tvScreenMesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    const center = new THREE.Vector3();
    box.getCenter(center);

    const worldQuat = new THREE.Quaternion();
    this.tvScreenMesh.getWorldQuaternion(worldQuat);

    const right = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(worldQuat)
      .normalize();
    const up = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(worldQuat)
      .normalize();
    let normal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(worldQuat)
      .normalize();
    if (this.tweak.normalFlip) normal.negate();

    // position at center + YOUR offsets
    cssObj.position.copy(center);
    cssObj.position.addScaledVector(right, this.tweak.offsetX);
    cssObj.position.addScaledVector(up, this.tweak.offsetY);
    cssObj.position.addScaledVector(normal, this.tweak.push);

    // rotation = screen + YOUR fine rotation
    cssObj.quaternion.copy(worldQuat);
    const qx = new THREE.Quaternion().setFromAxisAngle(right, this.tweak.rotX);
    const qy = new THREE.Quaternion().setFromAxisAngle(up, this.tweak.rotY);
    const qz = new THREE.Quaternion().setFromAxisAngle(normal, this.tweak.rotZ);
    cssObj.quaternion.multiply(qz).multiply(qy).multiply(qx);

    // ----------------------------
    // ✅ ONLY CHANGE: make it wider + less tall
    // ----------------------------
    const pxPerMeter = this.tweak.pxPerMeter;

    let sx = (size.x * pxPerMeter) / 1024;
    let sy = (size.y * pxPerMeter) / 576;

    // Wider / shorter multipliers (NOT part of tweak values)
    const aspectX = 1.32; // more width
    const aspectY = 0.7; // less height
    sx *= aspectX;
    sy *= aspectY;

    // safety clamp
    sx = THREE.MathUtils.clamp(sx, 0.0005, 0.05);
    sy = THREE.MathUtils.clamp(sy, 0.0005, 0.05);

    cssObj.scale.set(sx, sy, 1);
    // ----------------------------

    this.cssObj = cssObj;
    this.cssScene.add(cssObj);
  }

  update() {
    if (!this.tvScreenMesh || !this.cssObj || !this.cssContainer) return;

    const inTvMode =
      this.navigation?.state === "focused" &&
      this.navigation?.activeStage === "tv";

    this.cssObj.visible = inTvMode;

    this.cssContainer.style.pointerEvents = "none";
    if (!inTvMode) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hovering =
      this.raycaster.intersectObject(this.tvScreenMesh, true).length > 0;

    this.cssContainer.style.pointerEvents = hovering ? "auto" : "none";
  }

  destroy() {
    window.removeEventListener("pointermove", this._onMouseMove);
    if (this.cssObj) this.cssScene.remove(this.cssObj);
    if (this.cssContainer) this.cssContainer.style.pointerEvents = "none";
  }
}
