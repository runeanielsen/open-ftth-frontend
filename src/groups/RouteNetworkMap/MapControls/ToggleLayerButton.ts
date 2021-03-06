import { Map } from "mapbox-gl";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import "./ToggleLayerButton.scss";

library.add(faLayerGroup);

class ToggleLayerButton {
  className: string;
  layerName: string;
  container: HTMLElement | null;
  map: Map | undefined;

  constructor(layerName: string) {
    this.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this.layerName = layerName;
    this.container = null;
  }

  onAdd(map: Map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = this.className;

    const buttonIcon = icon({ prefix: "fas", iconName: "layer-group" }).node[0];
    const button = document.createElement("button");
    button.appendChild(buttonIcon);
    button.className = "toggle-layer-button";
    button.addEventListener("click", () => {
      this.toggleLayerName();
    });

    this.container.appendChild(button);

    return this.container;
  }

  onRemove() {
    if (!this.container || !this.map) return;

    this.container?.parentNode?.removeChild(this.container);
    this.map = undefined;
  }

  toggleLayerName() {
    if (!this.map || !this.container) return;

    var visibility = this.map.getLayoutProperty(this.layerName, "visibility");

    if (visibility === "visible") {
      this.map.setLayoutProperty(this.layerName, "visibility", "none");
      this.container.firstElementChild?.classList.remove("active");
    } else {
      this.map.setLayoutProperty(this.layerName, "visibility", "visible");
      this.container.firstElementChild?.classList.add("active");
    }
  }
}

export default ToggleLayerButton;
