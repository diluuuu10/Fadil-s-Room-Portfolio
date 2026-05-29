// src/Experience/World/PCIframe.js
import CssScreenFrame from "./CssScreenFrame.js";

export default class PCIframe {
  constructor({ roomModel, navigation }) {
    this.roomModel = roomModel;
    this.navigation = navigation;

    // SHOP controls (from Computer UI)
    this.shopIndex = new Map(); // key: item name (Rocket) -> Mesh[]
    this.supportedShopItems = ["Rocket", "Ball", "Stool", "Bike", "Barbell"];

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

    this.buildShopIndex();
    this.frame = new CssScreenFrame({
      roomModel,
      navigation,
      stage: "computer",
      screenName: "Comp_Screen",
      url: "/computer-ui/index.html",
      title: "Room95 desktop",
      size: {
        width: 820,
        height: 525,
      },
      transform: {
        pxPerMeter: 0.6,
        offsetX: 0.005,
        offsetY: 0.015,
        push: 0,
        normalFlip: false,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        aspectX: 1,
        aspectY: 1,
        scaleBaseWidth: 1024,
        scaleBaseHeight: 576,
      },
      borderRadius: 18,
    });

    this.compScreenMesh = this.frame.mesh;
    this.cssObj = this.frame.cssObj;
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

  update() {
    this.frame.update();
  }

  destroy() {
    window.removeEventListener("message", this._onMessage);
    this.frame.destroy();
  }
}
