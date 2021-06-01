import { useEffect, useContext, useState } from "react";
import { useClient } from "urql";
import { w3cwebsocket } from "websocket";
import PubSub from "pubsub-js";
import Config from "../config";
import useBridgeConnector, {
  RetrieveSelectedSpanEquipmentsResponse,
} from "../bridge/useBridgeConnector";
import { MapContext } from "../contexts/MapContext";
import { useKeycloak } from "@react-keycloak/web";
import {
  SPAN_SEGMENT_TRACE,
  SpanSegmentTraceResponse,
} from "./BridgeConnectorGql";

type IdentifyNetworkEvent = {
  eventType: string;
  identifiedFeatureId: string;
  selectedType: string;
  username: string;
};

let websocketClient: w3cwebsocket | null;

function send(eventMsg: any) {
  websocketClient?.send(JSON.stringify(eventMsg));
}

function BridgeConnector() {
  const { setSelectedSegmentIds, setIdentifiedFeature, traceRouteNetworkId } =
    useContext(MapContext);
  const [connected, setConnected] = useState(false);
  const {
    retrieveSelectedEquipments,
    retrieveIdentifiedNetworkElement,
    highlightFeatures,
  } = useBridgeConnector();
  const { keycloak } = useKeycloak();
  const graphqlClient = useClient();

  useEffect(() => {
    function setup() {
      websocketClient = new w3cwebsocket(Config.DESKTOP_BRIDGE_URI);

      websocketClient.onmessage = (message: any) => {
        const event = JSON.parse(message.data);
        PubSub.publish(event.eventType, event);
      };

      websocketClient.onopen = () => {
        setConnected(true);
        console.log("Connected to BridgeConnector");
      };

      websocketClient.onclose = () => {
        console.log("Disconnected from BridgeConnector");
        setConnected(false);
        reconnect();
      };

      websocketClient.onerror = () => {
        console.log("Error happend in BridgeConnector");
        setConnected(false);
        reconnect();
      };

      function reconnect() {
        setTimeout(() => {
          console.log("Reconnecting to BridgeConnector");
          setup();
        }, 5000);
      }
    }

    setup();

    return () => {
      setConnected(false);
      websocketClient = null;
    };
  }, []);

  useEffect(() => {
    if (!connected || !websocketClient || websocketClient.readyState !== 1)
      return;

    const token = PubSub.subscribe(
      "RetrieveSelectedResponse",
      async (_msg: string, data: RetrieveSelectedSpanEquipmentsResponse) => {
        if (data.username === keycloak.profile?.username) {
          setSelectedSegmentIds(data.selectedFeaturesMrid);
        }
      }
    );

    retrieveSelectedEquipments();

    return () => {
      PubSub.unsubscribe(token);
    };
  }, [
    connected,
    setSelectedSegmentIds,
    retrieveSelectedEquipments,
    keycloak.profile?.username,
  ]);

  useEffect(() => {
    if (!connected || !websocketClient || websocketClient.readyState !== 1)
      return;

    const token = PubSub.subscribe(
      "IdentifyNetworkElement",
      (_msg: string, data: IdentifyNetworkEvent) => {
        if (
          data.selectedType !== "RouteNode" &&
          data.selectedType !== "RouteSegment"
        ) {
          // Do nothing
          return;
        }

        if (data.username === keycloak.profile?.username) {
          setIdentifiedFeature({
            id: data.identifiedFeatureId,
            type: data.selectedType as "RouteSegment" | "RouteNode",
          });
        }
      }
    );

    retrieveIdentifiedNetworkElement();

    return () => {
      PubSub.unsubscribe(token);
    };
  }, [
    connected,
    retrieveIdentifiedNetworkElement,
    setIdentifiedFeature,
    keycloak.profile?.username,
  ]);

  useEffect(() => {
    if (!connected || !websocketClient || websocketClient.readyState !== 1)
      return;

    if (!traceRouteNetworkId) {
      highlightFeatures([]);
      return;
    }

    graphqlClient
      .query<SpanSegmentTraceResponse>(SPAN_SEGMENT_TRACE, {
        spanSegmentId: traceRouteNetworkId,
      })
      .toPromise()
      .then((x) => {
        highlightFeatures(
          x.data?.utilityNetwork.spanSegmentTrace.routeNetworkSegmentIds ?? []
        );
      });
  }, [traceRouteNetworkId, highlightFeatures, graphqlClient, connected]);

  return <></>;
}

export default BridgeConnector;
export { send };
