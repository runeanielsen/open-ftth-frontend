import { useEffect, useReducer, useMemo } from "react";
import { useClient, useQuery } from "urql";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import SelectMenu, { SelectOption } from "../../../components/SelectMenu";
import TextBox from "../../../components/TextBox";
import DefaultButton from "../../../components/DefaultButton";
import NumberPicker from "../../../components/NumberPicker";
import LabelContainer from "../../../components/LabelContainer";
import {
  PlacementMethod,
  QUERY_TERMINAL_EQUIPMENT,
  TerminalEquipmentSpecification,
  SpanEquipmentSpecificationsResponse,
  Manufacturer,
  QUERY_RACK,
  RackResponse,
  PlaceTerminalEquipmentInNodeContainerParams,
  PLACE_TERMINAL_EQUIPMENT_IN_NODE_CONTAINER,
  PlaceTerminalEquipmentInNodeContainerResponse,
  NamingMethod,
} from "./AddTerminalEquipmentGql";

function categoryToOptions(
  specs: TerminalEquipmentSpecification[],
  isRackEquipment: boolean
): SelectOption[] {
  return [
    ...new Set(
      specs
        .filter((x) => x.isRackEquipment === isRackEquipment)
        .map((x) => x.category)
    ),
  ].map((x, i) => ({
    text: x,
    value: x,
    key: i,
  }));
}

function specificationToOptions(
  specs: TerminalEquipmentSpecification[],
  category: string,
  isRackEquipment: boolean
): SelectOption[] {
  return specs
    .filter((x) => x.isRackEquipment === isRackEquipment)
    .filter((x) => x.category === category)
    .map((x) => ({ text: x.name, value: x.id, key: x.id }));
}

function manufacturerToOptions(
  specs: Manufacturer[],
  refs: string[]
): SelectOption[] {
  return specs
    .filter((x) => refs.findIndex((y) => y === x.id))
    .map((x) => ({ text: x.name, value: x.id, key: x.id }));
}

interface State {
  category: string;
  specification: string;
  manufacturer: string;
  name: string;
  count: number;
  startNumber: number;
  startUnitPosition: number;
  placementMethod: PlacementMethod;
  namingMethod: NamingMethod;
}

type Action =
  | { type: "setCategory"; id: string }
  | { type: "setSpecification"; id: string }
  | { type: "setManufacturer"; id: string }
  | { type: "setName"; text: string }
  | { type: "setCount"; count: number }
  | { type: "setStartNumber"; startNumber: number }
  | { type: "setStartUnitPosition"; unitPosition: number }
  | { type: "setPlacementMethod"; method: PlacementMethod }
  | { type: "setNamingMethod"; method: NamingMethod }
  | { type: "reset" };

const initialState: State = {
  category: "",
  specification: "",
  manufacturer: "",
  name: "",
  count: 1,
  startNumber: 1,
  startUnitPosition: 0,
  placementMethod: "TOP_DOWN",
  namingMethod: "NAME_AND_NUMBER",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setCategory":
      return {
        ...state,
        category: action.id,
        specification: "",
        manufacturer: "",
      };
    case "setSpecification":
      return { ...state, specification: action.id, manufacturer: "" };
    case "setManufacturer":
      return { ...state, manufacturer: action.id };
    case "setName":
      return { ...state, name: action.text };
    case "setCount":
      return { ...state, count: action.count };
    case "setStartNumber":
      return { ...state, startNumber: action.startNumber };
    case "setStartUnitPosition":
      return { ...state, startUnitPosition: action.unitPosition };
    case "setPlacementMethod":
      return { ...state, placementMethod: action.method };
    case "setNamingMethod":
      return { ...state, namingMethod: action.method };
    case "reset":
      return initialState;
    default:
      throw new Error("No action found.");
  }
}

interface AddTerminalEquipmentProps {
  routeNodeId: string;
  rackId?: string;
}

function AddTerminalEquipment({
  routeNodeId,
  rackId,
}: AddTerminalEquipmentProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();
  const client = useClient();

  const [specificationResponse] = useQuery<SpanEquipmentSpecificationsResponse>(
    {
      query: QUERY_TERMINAL_EQUIPMENT,
    }
  );

  const [rackResponse] = useQuery<RackResponse>({
    query: QUERY_RACK,
    variables: { routeNodeId: routeNodeId, rackId: rackId },
    pause: !routeNodeId || !rackId,
  });

  const categoryOptions = useMemo<SelectOption[]>(() => {
    if (
      !specificationResponse.data?.utilityNetwork
        .terminalEquipmentSpecifications
    )
      return [];
    return categoryToOptions(
      specificationResponse.data.utilityNetwork.terminalEquipmentSpecifications,
      !!rackId
    );
  }, [
    specificationResponse.data?.utilityNetwork.terminalEquipmentSpecifications,
    rackId,
  ]);

  const specificationOptions = useMemo<SelectOption[]>(() => {
    if (
      !specificationResponse.data?.utilityNetwork
        .terminalEquipmentSpecifications ||
      !state.category
    )
      return [];
    return specificationToOptions(
      specificationResponse.data.utilityNetwork.terminalEquipmentSpecifications,
      state.category,
      !!rackId
    );
  }, [
    specificationResponse.data?.utilityNetwork.terminalEquipmentSpecifications,
    state.category,
    rackId,
  ]);

  const manufacturerOptions = useMemo<SelectOption[]>(() => {
    if (
      !specificationResponse.data?.utilityNetwork
        .terminalEquipmentSpecifications ||
      !state.specification
    )
      return [];
    return manufacturerToOptions(
      specificationResponse.data.utilityNetwork.manufacturers,
      specificationResponse.data.utilityNetwork.terminalEquipmentSpecifications.find(
        (x) => x.id === state.specification
      )?.manufacturerRefs ?? []
    );
  }, [state.specification, specificationResponse]);

  useEffect(() => {
    if (!categoryOptions || categoryOptions.length === 0) return;
    dispatch({ type: "setCategory", id: categoryOptions[0].value as string });
  }, [categoryOptions]);

  const addTerminalEquipment = async () => {
    const params: PlaceTerminalEquipmentInNodeContainerParams = {
      routeNodeId: routeNodeId,
      terminalEquipmentSpecificationId: state.specification,
      namingInfo: { name: state.name },
      numberOfEquipments: state.count,
      startSequenceNumber: state.startNumber,
      terminalEquipmentNamingMethod: state.namingMethod,
      subrackPlacementInfo: rackId
        ? {
            placementMethod: state.placementMethod,
            rackId: rackId,
            startUnitPosition: state.startUnitPosition,
          }
        : null,
    };

    const response = await client
      .mutation<PlaceTerminalEquipmentInNodeContainerResponse>(
        PLACE_TERMINAL_EQUIPMENT_IN_NODE_CONTAINER,
        params
      )
      .toPromise();

    if (
      !response.data?.nodeContainer?.placeTerminalEquipmentInNodeContainer
        ?.isSuccess
    ) {
      toast.error(
        t(
          response.data?.nodeContainer.placeTerminalEquipmentInNodeContainer
            .errorCode ?? "ERROR"
        )
      );
    } else {
      dispatch({ type: "reset" });
    }
  };

  return (
    <div className="add-terminal-equipment">
      <div className="full-row-group">
        <div className="full-row">
          <LabelContainer text={`${t("CATEGORY")}:`}>
            <SelectMenu
              autoSelectFirst={true}
              options={categoryOptions}
              removePlaceHolderOnSelect
              onSelected={(x) =>
                dispatch({ type: "setCategory", id: x as string })
              }
              selected={state.category}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("SPECIFICATION")}:`}>
            <SelectMenu
              autoSelectFirst={true}
              options={specificationOptions}
              removePlaceHolderOnSelect
              onSelected={(x) =>
                dispatch({ type: "setSpecification", id: x as string })
              }
              selected={state.specification}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("MANUFACTURER")}:`}>
            <SelectMenu
              autoSelectFirst={true}
              options={manufacturerOptions}
              removePlaceHolderOnSelect
              onSelected={(x) =>
                dispatch({ type: "setManufacturer", id: x as string })
              }
              selected={state.manufacturer}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("NAME")}:`}>
            <TextBox
              value={state.name}
              setValue={(x) => dispatch({ type: "setName", text: x })}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("COUNT")}:`}>
            <NumberPicker
              value={state.count}
              setValue={(x) => dispatch({ type: "setCount", count: x })}
              minValue={0}
              maxValue={100}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("START_NUMBER")}:`}>
            <NumberPicker
              value={state.startNumber}
              minValue={0}
              maxValue={100}
              setValue={(x) =>
                dispatch({ type: "setStartNumber", startNumber: x })
              }
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("LABEL_METHOD")}:`}>
            <SelectMenu
              options={[
                {
                  text: t("NAME_AND_NUMBER"),
                  value: "NAME_AND_NUMBER",
                  key: 0,
                },
                { text: t("NAME_ONLY"), value: "NAME_ONLY", key: 1 },
                { text: t("NUMBER_ONLY"), value: "NUMBER_ONLY", key: 2 },
              ]}
              removePlaceHolderOnSelect
              onSelected={(x) =>
                dispatch({
                  type: "setNamingMethod",
                  method: x as NamingMethod,
                })
              }
              selected={state.namingMethod}
            />
          </LabelContainer>
        </div>
      </div>
      {rackId && (
        <div className="full-row-group">
          <p className="full-row-group__title">
            {rackResponse.data?.utilityNetwork.rack.name}
          </p>
          <div className="full-row">
            <LabelContainer text={`${t("RACK_UNIT")}:`}>
              <NumberPicker
                value={state.startUnitPosition}
                minValue={0}
                maxValue={100}
                setValue={(x) =>
                  dispatch({ type: "setStartUnitPosition", unitPosition: x })
                }
              />
            </LabelContainer>
          </div>
          <div className="full-row">
            <LabelContainer text={`${t("PLACEMENT_METHOD")}:`}>
              <SelectMenu
                options={[
                  { text: t("TOP_DOWN"), value: "TOP_DOWN", key: 0 },
                  { text: t("BOTTOM_UP"), value: "BOTTOM_UP", key: 1 },
                ]}
                removePlaceHolderOnSelect
                onSelected={(x) =>
                  dispatch({
                    type: "setPlacementMethod",
                    method: x as PlacementMethod,
                  })
                }
                selected={state.placementMethod}
              />
            </LabelContainer>
          </div>
        </div>
      )}
      <div className="full-row">
        <DefaultButton
          disabled={state.count === 0 || !state.startNumber}
          innerText={t("ADD")}
          onClick={() => addTerminalEquipment()}
        />
      </div>
    </div>
  );
}

export default AddTerminalEquipment;