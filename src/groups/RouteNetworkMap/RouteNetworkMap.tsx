import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import {
  GeoJSONSource,
  Map,
  MapGeoJSONFeature,
  MapMouseEvent,
  PointLike,
  StyleSpecification,
  SymbolLayerSpecification,
  ScaleControl,
  AttributionControl,
  NavigationControl,
  GeolocateControl,
  LegacyFilterSpecification,
} from "maplibre-gl";
import { useContext, useEffect, useRef, useState } from "react";
import Config from "../../config";
import { MapContext } from "../../contexts/MapContext";
import ToggleLayerButton from "./MapControls/ToggleLayerButton";
import MeasureDistanceControl from "./MapControls/MeasureDistanceControl";
import ToggleDiagramControl from "./MapControls/ToggleDiagramControl";
import InformationControl from "./MapControls/InformationControl";
import SaveImgControl from "./MapControls/SaveImgControl";
import SelectControl from "./MapControls/SelectControl";
import PlaceCableControl from "./MapControls/PlaceCableControl";
import ClearSelectionControl from "./MapControls/ClearSelectionControl";
import { v4 as uuidv4 } from "uuid";
import { OverlayContext } from "../../contexts/OverlayContext";
import ModalContainer from "../../components/ModalContainer";
import PlaceSpanEquipmentPage from "../../pages/PlaceSpanEquipmentPage";

const GetMaplibreStyle = async (): Promise<StyleSpecification> => {
  const maplibre = await fetch(`./maplibre.json?${uuidv4()}`);
  const json = await maplibre.json();
  return json as StyleSpecification;
};

function enableResize(map: Map) {
  window.addEventListener("resize", () => {
    // Hack to handle resize of mapcanvas because
    // the event gets called to early, so we have to queue it up
    setTimeout(() => {
      map.resize();
    }, 1);
  });
}

function hoverPointer(featureNames: string[], bboxSize: number, map: Map) {
  map.on("mousemove", (e: MapMouseEvent) => {
    const bbox: [PointLike, PointLike] = [
      [e.point.x - bboxSize, e.point.y - bboxSize],
      [e.point.x + bboxSize, e.point.y + bboxSize],
    ];

    var features = map.queryRenderedFeatures(bbox, {
      filter: [
        "any",
        ...featureNames.map((x) => {
          return ["==", "objecttype", x];
        }),
      ] as LegacyFilterSpecification,
    });

    if (map.getCanvas().style.cursor !== "progress") {
      if (features.length > 0) {
        map.getCanvas().style.cursor = "pointer";
      } else {
        map.getCanvas().style.cursor = "";
      }
    }
  });
}

function highlightFeature(
  map: Map,
  lastHighlightedFeature: React.RefObject<MapGeoJSONFeature | null>,
  feature: MapGeoJSONFeature,
) {
  const changeSymbolIconImageHighlight = (
    iconLayer: any,
    feature: MapGeoJSONFeature,
    remove: boolean,
  ) => {
    // We have to do this check because mapbox is annoying and changes the type "randomly"
    let icon =
      typeof iconLayer !== "string" ? (iconLayer.name as string) : iconLayer;

    // In case that we switch from highlighted icon to another
    if (icon.endsWith("-highlight")) {
      icon = icon.replace("-highlight", "");
    }

    // This is required because we cannot use state for icons in mapbox to switch icon.
    map.setLayoutProperty(feature.layer?.id, "icon-image", [
      "match",
      ["id"],
      remove ? -1 : feature.id,
      `${icon}-highlight`,
      icon,
    ]);
  };

  // reset last state to avoid multiple selected at the same time
  if (lastHighlightedFeature.current) {
    // We have to change it to any because mapbox changes the type randomly
    const iconImage = (
      lastHighlightedFeature.current?.layer as SymbolLayerSpecification
    ).layout?.["icon-image"] as any;

    // If it has iconImage change highlight
    if (iconImage) {
      changeSymbolIconImageHighlight(
        iconImage,
        lastHighlightedFeature.current,
        true,
      );
    }

    map.setFeatureState(lastHighlightedFeature.current, {
      ...lastHighlightedFeature.current,
      selected: false,
    });
  }

  // We have to change it to any because mapbox changes the type randomly
  const iconImage = (feature.layer as SymbolLayerSpecification).layout?.[
    "icon-image"
  ] as any;
  // If it has iconImage change highlight
  if (iconImage) {
    changeSymbolIconImageHighlight(iconImage, feature, false);
  }

  feature.state.selected = !feature.state.selected;
  map.setFeatureState(feature, {
    ...feature,
    selected: feature.state.selected,
  });
}

function clickHighlight(
  featureNames: string[],
  bboxSize: number,
  map: Map,
  lastHighlightedFeature: React.RefObject<MapGeoJSONFeature | null>,
  measureDistanceControl: MeasureDistanceControl,
  informationControl: InformationControl | null,
  selectControl: SelectControl | null,
  callback: (feature: MapGeoJSONFeature) => void,
) {
  map.on("click", (e) => {
    // Do nothing if the measure distance control is active to avoid
    // annoyances for the user doing measureing.
    if (measureDistanceControl.active) return;

    // Do nothing if the information control is active.
    if (informationControl?.active) return;

    // Do nothing if the select control is active.
    if (selectControl?.active) return;

    const bbox: [PointLike, PointLike] = [
      [e.point.x - bboxSize, e.point.y - bboxSize],
      [e.point.x + bboxSize, e.point.y + bboxSize],
    ];

    const changeSymbolIconImageHighlight = (
      iconLayer: any,
      feature: MapGeoJSONFeature,
      remove: boolean,
    ) => {
      // We have to do this check because mapbox is annoying and changes the type "randomly"
      let icon =
        typeof iconLayer !== "string" ? (iconLayer.name as string) : iconLayer;

      // In case that we switch from highlighted icon to another
      if (icon.endsWith("-highlight")) {
        icon = icon.replace("-highlight", "");
      }

      // This is required because we cannot use state for icons in mapbox to switch icon.
      map.setLayoutProperty(feature.layer?.id, "icon-image", [
        "match",
        ["id"],
        remove ? -1 : feature.id,
        `${icon}-highlight`,
        icon,
      ]);
    };

    // reset last state to avoid multiple selected at the same time
    if (lastHighlightedFeature.current) {
      // We have to change it to any because mapbox changes the type randomly
      const iconImage = (
        lastHighlightedFeature.current?.layer as SymbolLayerSpecification
      ).layout?.["icon-image"] as any;

      // If it has iconImage change highlight
      if (iconImage) {
        changeSymbolIconImageHighlight(
          iconImage,
          lastHighlightedFeature.current,
          true,
        );
      }

      map.setFeatureState(lastHighlightedFeature.current, {
        ...lastHighlightedFeature.current,
        selected: false,
      });
    }

    const feature = map
      .queryRenderedFeatures(bbox)
      .find((x) => featureNames.find((y) => y === x.properties?.objecttype));

    if (!feature) {
      return;
    }

    // We have to change it to any because mapbox changes the type randomly
    const iconImage = (feature.layer as SymbolLayerSpecification).layout?.[
      "icon-image"
    ] as any;
    // If it has iconImage change highlight
    if (iconImage) {
      changeSymbolIconImageHighlight(iconImage, feature, false);
    }

    feature.state.selected = !feature.state.selected;
    map.setFeatureState(feature, {
      ...feature,
      selected: feature.state.selected,
    });

    if (callback) callback(feature);
  });
}

function highlightGeometries(map: Map, geoms: string[]) {
  const features = geoms.map<Feature<Geometry, GeoJsonProperties>>((x, i) => {
    return {
      id: i,
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: JSON.parse(x),
      },
      properties: {},
    };
  });

  (map.getSource("route_segment_trace") as GeoJSONSource)?.setData({
    type: "FeatureCollection",
    features: features ?? [],
  });
}

function mapFitBounds(
  map: Map,
  envelope: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  },
  animate: boolean,
) {
  map.fitBounds(
    [
      [envelope.minX, envelope.minY],
      [envelope.maxX, envelope.maxY],
    ],
    {
      animate: animate,
    },
  );
}

type RouteNetworkMapProps = {
  showSchematicDiagram: (show: boolean) => void;
  initialEnvelope?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  initialMarker?: {
    x: number;
    y: number;
  };
  isWriter: boolean;
};

function RouteNetworkMap({
  showSchematicDiagram,
  initialEnvelope,
  initialMarker,
  isWriter,
}: RouteNetworkMapProps) {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const lastHighlightedFeature = useRef<MapGeoJSONFeature | null>(null);
  const map = useRef<Map | null>(null);
  const [showPlaceSpanEquipment, setShowPlaceSpanEquipment] =
    useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const {
    appendSegmentSelection: toggleSelectedSegmentId,
    setSelectedSegmentIds,
    selectedSegmentIds,
    setIdentifiedFeature,
    trace,
    searchResult,
    identifiedFeature,
    subscribeTilesetUpdated,
    unSubscribeTilesetUpdated,
    clearSelection,
    setIsInSelectionMode,
    isLoading,
  } = useContext(MapContext);
  const { showElement } = useContext(OverlayContext);
  const [mapLibreStyle, setMaplibreStyle] = useState<StyleSpecification | null>(
    null,
  );

  useEffect(() => {
    GetMaplibreStyle().then((r) => {
      setMaplibreStyle(r);
    });
  }, [setMaplibreStyle]);

  useEffect(() => {
    if (showPlaceSpanEquipment) {
      showElement(
        <ModalContainer
          title={t("Place span equipments")}
          closeCallback={() => setShowPlaceSpanEquipment(false)}
        >
          <PlaceSpanEquipmentPage />
        </ModalContainer>,
      );

      return () => {
        showElement(null);
      };
    }
  }, [showElement, showPlaceSpanEquipment, setShowPlaceSpanEquipment, t]);

  useEffect(() => {
    if (mapLoaded && map.current && initialEnvelope) {
      mapFitBounds(map.current, initialEnvelope, false);
    }
  }, [map, initialEnvelope, mapLoaded]);

  useEffect(() => {
    const cancelToken = subscribeTilesetUpdated((tilesetName: string) => {
      if (!map.current) {
        console.warn(
          `Could not refresh tileset with name: '${tilesetName}', no map has been set yet.`,
        );
        return;
      }

      const m = map.current;
      const sourceCache = m.style.sourceCaches[tilesetName];

      // Reload the whole cache
      sourceCache.reload(true);

      // Refresh the current files.
      m.refreshTiles(
        tilesetName,
        sourceCache
          .getIds()
          .map((id) => sourceCache._tiles[id].tileID.canonical),
      );

      // Will be left in there for now for debug purposes.
      console.log(`Refreshed tileset with name: '${tilesetName}'.`);
    });

    return () => {
      unSubscribeTilesetUpdated(cancelToken);
    };
  }, [map, subscribeTilesetUpdated, unSubscribeTilesetUpdated]);

  useEffect(() => {
    if (mapLoaded && map.current && initialMarker) {
      const features: Feature<Geometry, GeoJsonProperties>[] = [];
      const feature: Feature<Geometry, GeoJsonProperties> = {
        id: 0,
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [initialMarker.x, initialMarker.y],
        },
        properties: {},
      };

      features.push(feature);

      (map.current.getSource("initial_marker") as GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: features,
      });
    }
  }, [map, initialMarker, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    if (trace.wgs84) {
      mapFitBounds(
        map.current,
        {
          minX: trace.wgs84.minX,
          minY: trace.wgs84.minY,
          maxX: trace.wgs84.maxX,
          maxY: trace.wgs84.maxY,
        },
        false,
      );
    }
    highlightGeometries(map.current, trace.geometries);
  }, [trace, map, mapLoaded]);

  useEffect(() => {
    if (!mapLibreStyle || !mapContainer.current) return;

    const newMap = new Map({
      container: mapContainer.current,
      // We want to ous eour own glyphs in production.
      style: { ...mapLibreStyle, glyphs: "/fonts/{fontstack}/{range}.pbf" },
      doubleClickZoom: false,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
      dragRotate: false,
      maxZoom: 24,
    });

    newMap.touchZoomRotate.disableRotation();

    newMap.addControl(new ScaleControl({}), "bottom-left");

    newMap.addControl(
      new AttributionControl({
        customAttribution: [
          '<a href="http://www.openstreetmap.org/about/">© OpenStreetMap contributors</a>',
          '<a href="https://openmaptiles.org/">© OpenMapTiles</a>',
        ],
      }),
      "bottom-right",
    );

    newMap.addControl(
      new ToggleDiagramControl(showSchematicDiagram),
      "top-right",
    );

    newMap.addControl(
      new NavigationControl({
        showCompass: false,
      }),
      "top-left",
    );

    const selectControl = new SelectControl(
      (selection: MapGeoJSONFeature) => {
        toggleSelectedSegmentId(selection.properties.mrid);
      },
      () => clearSelection(),
      (selectState: boolean) => {
        setIsInSelectionMode(selectState);
      },
    );

    // These should only be shown if the user has write rights.
    if (isWriter) {
      newMap.addControl(selectControl, "top-right");

      newMap.addControl(
        new PlaceCableControl(() => {
          setShowPlaceSpanEquipment(true);
        }),
        "top-right",
      );

      newMap.addControl(
        new ClearSelectionControl(() => {
          setSelectedSegmentIds([]);
        }),
        "top-right",
      );
    }

    newMap.addControl(new SaveImgControl(), "top-right");

    let informationControl: InformationControl | null = null;

    if (
      Config.INFORMATION_CONTROL_CONFIG.sourceLayers &&
      Config.INFORMATION_CONTROL_CONFIG.sourceLayers.length > 0
    ) {
      informationControl = new InformationControl(
        Config.INFORMATION_CONTROL_CONFIG,
      );
      newMap.addControl(informationControl, "top-right");
    }

    newMap.addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: false,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }),
    );
    const measureDistanceControl = new MeasureDistanceControl(
      t("LENGTH"),
      t("TOTAL_LENGTH"),
    );
    newMap.addControl(measureDistanceControl, "top-right");

    newMap.on("load", () => {
      // We add this control here since it checks the style
      newMap.addControl(
        new ToggleLayerButton(
          Config.LAYERS.flatMap((x) => {
            return x.layerGroups;
          }),
        ),
        "top-right",
      );
      enableResize(newMap);
      hoverPointer(["route_node", "route_segment"], 10, newMap);
      clickHighlight(
        ["route_segment", "route_node"],
        10,
        newMap,
        lastHighlightedFeature,
        measureDistanceControl,
        informationControl,
        selectControl,
        (x) => {
          let type: "RouteNode" | "RouteSegment" | null = null;
          if (x?.properties?.objecttype === "route_node") {
            type = "RouteNode";
          } else if (x?.properties?.objecttype === "route_segment") {
            type = "RouteSegment";
          } else {
            throw Error(`${x.type} is not a valid type`);
          }

          // This should not happen, but in case it does we just returns and log it out.
          if (!map.current) {
            console.error("Could not get map after click, something is wrong.");
            return;
          }

          const currentMapCenter = map.current.getCenter();

          lastHighlightedFeature.current = x;

          setIdentifiedFeature({
            id: x?.properties?.mrid,
            type: type,
            extraMapInformation: {
              xCoordinate: currentMapCenter.lat,
              yCoordinate: currentMapCenter.lng,
              zoomLevel: map.current.getZoom(),
            },
          });
        },
      );

      newMap.addLayer({
        id: "route_segment_selection",
        type: "line",
        source: "route_network",
        "source-layer": "route_network",
        filter: ["in", ["get", "mrid"], ["literal", [""]]],
        paint: {
          "line-color": "#FFFF00",
          "line-width": 2,
        },
      });

      newMap.addSource("route_segment_trace", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      newMap.addLayer({
        id: "route_segment_trace",
        type: "line",
        source: "route_segment_trace",
        paint: {
          "line-color": "#40e0d0",
          "line-width": 4,
        },
      });

      newMap.addSource("search_marker", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      newMap.addLayer({
        id: "search_marker",
        type: "circle",
        source: "search_marker",
        paint: {
          "circle-radius": 12,
          "circle-stroke-width": 2,
          "circle-opacity": 0,
          "circle-stroke-color": "#FF0000",
        },
      });

      newMap.addSource("initial_marker", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      newMap.addLayer({
        id: "initial_marker",
        type: "circle",
        source: "initial_marker",
        paint: {
          "circle-radius": 12,
          "circle-stroke-width": 2,
          "circle-opacity": 0,
          "circle-stroke-color": "#FF0000",
        },
      });

      newMap.addSource("measurement", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      newMap.addLayer({
        id: "measure-points",
        type: "circle",
        source: "measurement",
        paint: {
          "circle-radius": 3,
          "circle-color": "#D20C0C",
        },
        filter: ["in", "$type", "Point"],
      });

      newMap.addLayer({
        id: "measure-lines",
        type: "line",
        source: "measurement",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#D20C0C",
          "line-width": 2.5,
          "line-dasharray": [0.2, 2],
        },
        filter: ["in", "$type", "LineString"],
      });

      map.current = newMap;
      setMapLoaded(true);
    });

    return () => {
      newMap.remove();
      map.current = null;
    };
  }, [
    setIdentifiedFeature,
    showSchematicDiagram,
    t,
    mapLibreStyle,
    setMapLoaded,
    toggleSelectedSegmentId,
    clearSelection,
    setShowPlaceSpanEquipment,
    setSelectedSegmentIds,
    isWriter,
    setIsInSelectionMode,
  ]);

  useEffect(() => {
    if (!map.current) return;

    const routeSegmentSelectionLayer = map.current.getLayer(
      "route_segment_selection",
    );

    if (!routeSegmentSelectionLayer) {
      throw Error("Could not find route segment selection layer.");
    }

    map.current.setFilter("route_segment_selection", [
      "in",
      ["get", "mrid"],
      ["literal", selectedSegmentIds],
    ]);
  }, [selectedSegmentIds]);

  useEffect(() => {
    if (!map.current || !searchResult) return;

    const features: Feature<Geometry, GeoJsonProperties>[] = [];
    const feature: Feature<Geometry, GeoJsonProperties> = {
      id: 0,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [searchResult.xwgs, searchResult.ywgs],
      },
      properties: {},
    };

    features.push(feature);

    (map.current.getSource("search_marker") as GeoJSONSource)?.setData({
      type: "FeatureCollection",
      features: features ?? [],
    });

    map.current.flyTo({
      center: [searchResult.xwgs, searchResult.ywgs],
      zoom: 17,
      animate: false,
    });
  }, [searchResult]);

  // This is used for browser history to zoom to coordinate in url.
  useEffect(() => {
    if (!identifiedFeature?.extraMapInformation || !map.current) {
      return;
    }

    map.current.flyTo({
      center: [
        identifiedFeature.extraMapInformation.yCoordinate,
        identifiedFeature.extraMapInformation.xCoordinate,
      ],
      zoom: identifiedFeature.extraMapInformation.zoomLevel,
      animate: false,
    });

    function onIdleCallback() {
      if (!map.current || !identifiedFeature) {
        return;
      }

      const feature = map.current
        .queryRenderedFeatures()
        .find((x) => x.properties?.mrid === identifiedFeature?.id);

      if (!feature) {
        map.current.off("idle", onIdleCallback);
        return;
      }

      if (feature.state.selected) {
        map.current.off("idle", onIdleCallback);
        return;
      }

      highlightFeature(map.current, lastHighlightedFeature, feature);
      lastHighlightedFeature.current = feature;

      map.current.off("idle", onIdleCallback);
    }

    map.current.on("idle", onIdleCallback);
  }, [identifiedFeature, mapLoaded]);

  useLayoutEffect(() => {
    if (!map.current) return;

    if (isLoading) {
      map.current.getCanvas().style.cursor = "progress";
    } else {
      map.current.getCanvas().style.cursor = "";
    }
  }, [isLoading]);

  return (
    <div
      className={`route-network-map ${
        mapLoaded ? "route-network-map--loaded" : ""
      }`}
    >
      <div className="route-network-map-container" ref={mapContainer}>
        <div id="distance" className="distance-container"></div>
      </div>
    </div>
  );
}

export default RouteNetworkMap;
