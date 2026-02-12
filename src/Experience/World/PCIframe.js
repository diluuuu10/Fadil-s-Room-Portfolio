// src/Experience/World/PCIframe.js
import * as THREE from "three";
import Experience from "../Experience.js";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

export default class PCIframe {
  constructor({ roomModel, navigation }) {
    this.experience = new Experience();
    this.roomModel = roomModel;
    this.navigation = navigation;

    this.camera = this.experience.camera.instance;
    this.canvas = this.experience.canvas;

    // ✅ reuse your existing CSS renderer scene/container
    this.cssScene = this.experience.cssTvScene;
    this.cssContainer = this.experience.cssTvContainer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.compScreenMesh = null;
    this.cssObj = null;

    // SHOP controls (from Computer UI)
    this.shopIndex = new Map(); // key: item name (Rocket) -> Mesh[]
    this.supportedShopItems = ["Rocket", "Ball", "Stool", "Bike", "Barbell"];

    // ✅ tweak separately from TV
    this.tweak = {
      pxPerMeter: 0.6,
      offsetX: 0.009,
      offsetY: 0.009,
      push: 0.0,
      normalFlip: false,

      rotX: 0.0,
      rotY: 0.0,
      rotZ: 0.0,

      aspectX: 1.0,
      aspectY: 1.0,
    };

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

    // Listen for UI events from the embedded computer UI (postMessage)
    this._onMessage = (event) => {
      const data = event?.data;
      if (!data || data.__room95 !== true) return;
      if (data.type !== "ROOM95_SHOP") return;

      const action = data.action;
      const item = data.item;
      if (!item || !this.supportedShopItems.includes(item)) return;

      if (action === "show") this.setShopVisible(item, true);
      if (action === "hide") this.setShopVisible(item, false);
      if (action === "toggle") this.toggleShop(item);
    };
    window.addEventListener("message", this._onMessage);

    if (this.cssContainer) this.cssContainer.style.pointerEvents = "none";

    this.findCompMesh();
    this.buildShopIndex();
    if (this.compScreenMesh) this.createIframe();
  }

  buildShopIndex() {
    // Build a lookup for SHOP_* meshes so UI clicks can reveal them.
    this.shopIndex.clear();
    this.supportedShopItems.forEach((k) => this.shopIndex.set(k, []));

    if (!this.roomModel) return;

    this.roomModel.traverse((o) => {
      if (!o?.isMesh) return;
      const name = o.name || "";

      // Expected naming: SHOP_Rocket, SHOP_Football, etc.
      for (const item of this.supportedShopItems) {
        const key = `SHOP_${item}`;
        if (name === key || name.startsWith(key)) {
          this.shopIndex.get(item)?.push(o);
          return;
        }
        // Some exports might use SHOP-item or SHOPItem; keep a loose fallback.
        if (
          name.startsWith("SHOP") &&
          name.toLowerCase().includes(item.toLowerCase())
        ) {
          this.shopIndex.get(item)?.push(o);
          return;
        }
      }
    });

    // Debug in console
    // eslint-disable-next-line no-console
    console.log(
      "[PCIframe] SHOP index:",
      Object.fromEntries(
        [...this.shopIndex.entries()].map(([k, arr]) => [
          k,
          arr.map((m) => m.name),
        ]),
      ),
    );
  }

  setShopVisible(item, visible) {
    const nodes = this.shopIndex.get(item);
    if (!nodes || nodes.length === 0) {
      console.warn(
        `[PCIframe] No SHOP meshes found for '${item}'. Check GLB names (SHOP_${item}).`,
      );
      return;
    }
    nodes.forEach((m) => (m.visible = visible));
  }

  toggleShop(item) {
    const nodes = this.shopIndex.get(item);
    if (!nodes || nodes.length === 0) return;
    const next = !(nodes[0].visible ?? false);
    this.setShopVisible(item, next);
  }

  findCompMesh() {
    // ✅ this matches your Navigation config: screenName: "Comp_Screen"
    this.roomModel.traverse((child) => {
      if (child?.isMesh && child.name === "Comp_Screen") {
        this.compScreenMesh = child;
      }
    });

    if (!this.compScreenMesh) {
      console.warn(
        "[PCIframe] Comp_Screen mesh not found. Check your GLB names.",
      );
    }
  }

  createIframe() {
    const wrapper = document.createElement("div");
    wrapper.style.width = "825px";
    wrapper.style.height = "450px";
    wrapper.style.pointerEvents = "auto";
    wrapper.style.background = "transparent";

    const iframe = document.createElement("iframe");
    iframe.src = "/computer-ui/index.html";
    iframe.allow = "autoplay; clipboard-write";
    iframe.style.width = "800px";
    iframe.style.height = "460px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "18px";
    iframe.style.background = "transparent";

    wrapper.appendChild(iframe);

    const cssObj = new CSS3DObject(wrapper);
    cssObj.visible = false;

    // compute screen box + orientation
    const box = new THREE.Box3().setFromObject(this.compScreenMesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    const center = new THREE.Vector3();
    box.getCenter(center);

    const worldQuat = new THREE.Quaternion();
    this.compScreenMesh.getWorldQuaternion(worldQuat);

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

    // position
    cssObj.position.copy(center);
    cssObj.position.addScaledVector(right, this.tweak.offsetX);
    cssObj.position.addScaledVector(up, this.tweak.offsetY);
    cssObj.position.addScaledVector(normal, this.tweak.push);

    // rotation
    cssObj.quaternion.copy(worldQuat);
    const qx = new THREE.Quaternion().setFromAxisAngle(right, this.tweak.rotX);
    const qy = new THREE.Quaternion().setFromAxisAngle(up, this.tweak.rotY);
    const qz = new THREE.Quaternion().setFromAxisAngle(normal, this.tweak.rotZ);
    cssObj.quaternion.multiply(qz).multiply(qy).multiply(qx);

    // scale
    const pxPerMeter = this.tweak.pxPerMeter;
    let sx = (size.x * pxPerMeter) / 1024;
    let sy = (size.y * pxPerMeter) / 576;

    sx *= this.tweak.aspectX;
    sy *= this.tweak.aspectY;

    sx = THREE.MathUtils.clamp(sx, 0.0005, 0.05);
    sy = THREE.MathUtils.clamp(sy, 0.0005, 0.05);

    cssObj.scale.set(sx, sy, 1);

    this.cssObj = cssObj;
    this.cssScene.add(cssObj);
  }

  update() {
    if (!this.compScreenMesh || !this.cssObj || !this.cssContainer) return;

    // ✅ ONLY when computer stage is focused
    const inPcMode =
      this.navigation?.state === "focused" &&
      this.navigation?.activeStage === "computer";

    this.cssObj.visible = inPcMode;

    this.cssContainer.style.pointerEvents = "none";
    if (!inPcMode) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hovering =
      this.raycaster.intersectObject(this.compScreenMesh, true).length > 0;

    this.cssContainer.style.pointerEvents = hovering ? "auto" : "none";
  }

  destroy() {
    window.removeEventListener("pointermove", this._onMouseMove);
    window.removeEventListener("message", this._onMessage);
    if (this.cssObj) this.cssScene.remove(this.cssObj);
    if (this.cssContainer) this.cssContainer.style.pointerEvents = "none";
  }
}
