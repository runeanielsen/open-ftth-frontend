import { useContext, useState, useEffect } from "react";
import { useQuery, useSubscription } from "urql";
import { MapContext } from "../../contexts/MapContext";
import RouteNetworkDiagram from "./EditDiagram";
import ReadOnlyDiagram from "./ReadOnlyDiagram";
import Loading from "../../components/Loading";
import {
  GET_DIAGRAM,
  DiagramQueryResponse,
  Envelope,
  Diagram,
  SCHEMATIC_DIAGRAM_UPDATED,
  DiagramUpdatedResponse,
} from "./DiagramWrapperGql";

type DiagramWrapperProps = {
  editable: boolean;
};

function getDiagramType(
  editable: boolean,
  envelope: Envelope,
  diagramObjects: Diagram[]
): JSX.Element {
  if (editable) {
    return (
      <RouteNetworkDiagram
        diagramObjects={diagramObjects}
        envelope={envelope}
      />
    );
  } else {
    return (
      <ReadOnlyDiagram diagramObjects={diagramObjects} envelope={envelope} />
    );
  }
}

function DiagramWrapper({ editable }: DiagramWrapperProps) {
  const { identifiedFeature } = useContext(MapContext);
  const [diagramObjects, setDiagramObjects] = useState<Diagram[]>([]);
  const [envelope, setEnvelope] = useState<Envelope>({
    maxX: 0,
    maxY: 0,
    minX: 0,
    minY: 0,
  });

  const [diagramQueryResult] = useQuery<DiagramQueryResponse>({
    query: GET_DIAGRAM,
    variables: {
      routeNetworkElementId: identifiedFeature?.id,
    },
    pause: !identifiedFeature?.id,
  });

  const [diagramSubscriptionResult] = useSubscription<DiagramUpdatedResponse>({
    query: SCHEMATIC_DIAGRAM_UPDATED,
    variables: { routeNetworkElementId: identifiedFeature?.id },
    pause: !identifiedFeature?.id,
  });

  useEffect(() => {
    if (!diagramQueryResult?.data) return;

    const { diagramObjects, envelope } =
      diagramQueryResult.data.schematic.buildDiagram;

    setDiagramObjects([...diagramObjects]);
    setEnvelope({ ...envelope });
  }, [diagramQueryResult]);

  useEffect(() => {
    if (!diagramSubscriptionResult?.data) return;

    const { diagramObjects, envelope } =
      diagramSubscriptionResult.data.schematicDiagramUpdated;

    setDiagramObjects([...diagramObjects]);
    setEnvelope({ ...envelope });
  }, [diagramSubscriptionResult]);

  if (diagramQueryResult.fetching) {
    return <Loading />;
  }

  if (!identifiedFeature?.id || !diagramQueryResult.data) {
    return <></>;
  }

  return <div>{getDiagramType(editable, envelope, diagramObjects)}</div>;
}

export default DiagramWrapper;