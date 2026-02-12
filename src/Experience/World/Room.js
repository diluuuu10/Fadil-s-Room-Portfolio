import Experience from "../Experience.js";
import * as THREE from "three";

export default class Room {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.resource = this.resources.items.roomModel;

    this.model = null;
    this.shopNodes = [];

    this.setModel();
    this.exposeConsoleHelpers();
  }

  setModel() {
    this.model = this.resource.scene;

    // ✅ IMPORTANT: ensure transforms are updated before bounds calc
    this.model.updateMatrixWorld(true);

    // ✅ Compute bounds WITHOUT SHOP meshes (new objects can mess up min.y)
    const box = new THREE.Box3();
    const tmpBox = new THREE.Box3();

    this.model.traverse((o) => {
      if (!o.isMesh) return;

      const name = o.name || "";

      // ignore SHOP + overlays from bounds
      if (name.startsWith("SHOP")) return;
      if (name.includes("__NightOverlay")) return;

      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      tmpBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(tmpBox);
    });

    // fallback if box became empty
    if (!isFinite(box.min.x) || !isFinite(box.min.y) || !isFinite(box.min.z)) {
      console.warn(
        "[Room] Bounds box empty after filters; skipping centering.",
      );
    } else {
      const center = box.getCenter(new THREE.Vector3());
      const min = box.min;

      // center X/Z
      this.model.position.x -= center.x;
      this.model.position.z -= center.z;

      // ✅ place on "floor" ONCE
      this.model.position.y -= min.y;

      const ROOM_Y_OFFSET = -1.5;
      this.model.position.y += ROOM_Y_OFFSET;
    }

    this.scene.add(this.model);

    // Debug: list TV-related names
    console.log("---- ROOM NAMES (contains 'tv') ----");
    this.model.traverse((o) => {
      if (o.name && o.name.toLowerCase().includes("tv")) {
        console.log(o.type, o.name);
      }
    });
    console.log("-----------------------------------");

    // ✅ Collect SHOP meshes + overlays (if any) for fallback console control
    this.shopNodes.length = 0;
    this.model.traverse((o) => {
      if (!o.isMesh) return;

      const name = o.name || "";
      if (
        name.startsWith("SHOP") ||
        name.startsWith("SHOP_") ||
        name.startsWith("SHOP-")
      ) {
        this.shopNodes.push(o);
      }
      if (name.includes("SHOP") && name.includes("__NightOverlay")) {
        this.shopNodes.push(o);
      }
    });
  }

  exposeConsoleHelpers() {
    window.ROOM = {
      room: this,
      model: this.model,

      listTv: () => {
        console.log("---- ROOM NAMES (contains 'tv') ----");
        this.model?.traverse((o) => {
          if (o.name && o.name.toLowerCase().includes("tv")) {
            console.log(o.type, o.name);
          }
        });
        console.log("-----------------------------------");
      },

      listShop: () => {
        console.log("[ROOM] SHOP nodes:");
        this.shopNodes.forEach((o) => console.log(" -", o.name));
        console.log("count:", this.shopNodes.length);
      },

      showShop: () => {
        this.shopNodes.forEach((o) => (o.visible = true));
        console.log("[ROOM] SHOP shown:", this.shopNodes.length);
      },

      hideShop: () => {
        this.shopNodes.forEach((o) => (o.visible = false));
        console.log("[ROOM] SHOP hidden:", this.shopNodes.length);
      },

      toggleShop: () => {
        const next = !(this.shopNodes[0]?.visible ?? false);
        this.shopNodes.forEach((o) => (o.visible = next));
        console.log("[ROOM] SHOP toggle ->", next ? "shown" : "hidden");
      },
    };
  }
}
