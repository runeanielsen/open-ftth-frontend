import { useContext } from "react";
import DefaultButton from "../../../components/DefaultButton";
import { useClient, Client } from "urql";
import useBridgeConnector from "../../../bridge/useBridgeConnector";
import { MapContext } from "../../../contexts/MapContext";
import { toast } from "react-toastify";
import { TFunction, useTranslation } from "react-i18next";
import {
  QUERY_GET_ROUTESEGMENT_IDS,
  GetRouteSegmentIdsParameter,
  GetRouteSegmentIdsResponse,
  MUTATION_REROUTE,
  RerouteParameter,
  RerouteResponse,
} from "./RerouteTubeGql";

type RerouteTubeParams = {
  selectedRouteSegmentMrid: string;
};

const selectRouteSegmentsInMap = async (
  id: string,
  client: Client,
  selectRouteSegments: (mrids: string[]) => void,
  t: TFunction<string>
) => {
  const params: GetRouteSegmentIdsParameter = {
    spanEquipmentOrSegmentId: id,
  };

  const result = await client
    .query<GetRouteSegmentIdsResponse>(QUERY_GET_ROUTESEGMENT_IDS, params)
    .toPromise();

  const mrids =
    result.data?.utilityNetwork?.spanEquipment?.routeSegmentIds ?? [];
  selectRouteSegments(mrids ?? []);

  toast.success(t("SELECTED"));
};

const reroute = async (
  id: string,
  routeSegmentIds: string[],
  client: Client,
  t: TFunction<string>
) => {
  const params: RerouteParameter = {
    spanEquipmentOrSegmentId: id,
    routeSegmentIds: routeSegmentIds,
  };

  const result = await client
    .mutation<RerouteResponse>(MUTATION_REROUTE, params)
    .toPromise();

  if (result.data?.spanEquipment.move.isSuccess) {
    toast.success(t("SUCCESS_MOVED"));
  } else {
    toast.error(t(result.data?.spanEquipment.move.errorCode ?? "ERROR"));
  }
};

function RerouteTube({ selectedRouteSegmentMrid }: RerouteTubeParams) {
  const client = useClient();
  const { selectRouteSegments } = useBridgeConnector();
  const { selectedSegmentIds } = useContext(MapContext);
  const { t } = useTranslation();

  return (
    <div>
      <div className="full-row">
        <DefaultButton
          onClick={() =>
            selectRouteSegmentsInMap(
              selectedRouteSegmentMrid,
              client,
              selectRouteSegments,
              t
            )
          }
          innerText={t("SELECT")}
        />
        <DefaultButton
          onClick={() =>
            reroute(selectedRouteSegmentMrid, selectedSegmentIds, client, t)
          }
          innerText={t("MOVE")}
        />
      </div>
    </div>
  );
}

export default RerouteTube;
