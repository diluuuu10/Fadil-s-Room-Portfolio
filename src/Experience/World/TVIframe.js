import CssScreenFrame from "./CssScreenFrame.js";

export default class TVIframe {
  constructor({ roomModel, navigation }) {
    this.frame = new CssScreenFrame({
      roomModel,
      navigation,
      stage: "tv",
      screenName: "TV_Screen",
      url: "/tv-ps2/index.html",
      title: "TV portfolio",
      size: {
        width: 1024,
        height: 576,
      },
      transform: {
        pxPerMeter: 5.0,
        offsetX: 0.05,
        offsetY: 0.02,
        push: 0.02,
        normalFlip: false,
        rotX: 0,
        rotY: 0.9,
        rotZ: 0.03,
        aspectX: 0.45,
        aspectY: 0.18,
      },
      borderRadius: 18,
    });
  }

  get tvScreenMesh() {
    return this.frame.mesh;
  }

  get cssObj() {
    return this.frame.cssObj;
  }

  update() {
    this.frame.update();
  }

  destroy() {
    this.frame.destroy();
  }
}
