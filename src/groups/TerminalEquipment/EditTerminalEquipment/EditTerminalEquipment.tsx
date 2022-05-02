import { useReducer, useEffect, useMemo } from "react";
import { useClient } from "urql";
import { toast } from "react-toastify";
import { useTranslation, TFunction } from "react-i18next";
import SelectMenu, { SelectOption } from "../../../components/SelectMenu";
import TextBox from "../../../components/TextBox";
import DefaultButton from "../../../components/DefaultButton";
import LabelContainer from "../../../components/LabelContainer";
import NumberPicker from "../../../components/NumberPicker";
import {
  queryTerminalEquipmentDetails,
  TerminalEquipment,
  queryTerminalEquipmentSpecifications,
  Manufacturer,
  TerminalEquipmentSpecification,
  queryNearestAccessAddresses,
  NearestAccessAddress,
  UnitAddress,
  Rack,
  queryRacks,
  updateTerminalEquipment,
} from "./EditTerminalEquipmentGql";

function rackToOption(racks: Rack[]): SelectOption[] {
  return racks.map((x) => ({ text: x.name, value: x.id, key: x.id }));
}

function accessAddressToOption(
  nearestAccessAddress: NearestAccessAddress,
  t: TFunction<"translation">
): SelectOption {
  return {
    text: `${nearestAccessAddress.accessAddress.roadName} ${
      nearestAccessAddress.accessAddress.houseNumber
    } - (${nearestAccessAddress.distance.toFixed(2)} ${t("METER")})`,
    value: nearestAccessAddress.accessAddress.id,
    key: nearestAccessAddress.accessAddress.id,
  };
}

function unitAddressToOption(unitAddress: UnitAddress): SelectOption {
  return {
    text: `${unitAddress.floorName ?? ""} ${unitAddress.suitName ?? ""}`,
    value: unitAddress.id,
    key: unitAddress.id,
  };
}

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
  categoryName: string | null;
  specificationId: string | null;
  manufacturerId: string | null;
  accessAddressId: string | null;
  unitAddressId: string | null;
  rackId: string | null;
  rackPosition: number | null;
  name: string | null;
  terminalEquipment: TerminalEquipment | null;
  manufacturers: Manufacturer[] | null;
  terminalEquipmentSpecifications: TerminalEquipmentSpecification[] | null;
  nearestAccessAddresses: NearestAccessAddress[] | null;
  additionalAddressInformation: string | null;
  racks: Rack[] | null;
}

const initialState: State = {
  categoryName: null,
  specificationId: null,
  manufacturerId: null,
  accessAddressId: null,
  unitAddressId: null,
  rackId: null,
  rackPosition: null,
  name: null,
  terminalEquipment: null,
  manufacturers: null,
  terminalEquipmentSpecifications: null,
  nearestAccessAddresses: null,
  additionalAddressInformation: null,
  racks: null,
};

type Action =
  | { type: "setTerminalEquipment"; terminalEquipment: TerminalEquipment }
  | { type: "setManufacturers"; manufacturers: Manufacturer[] }
  | {
      type: "setTerminalEquipmentSpecifications";
      specifications: TerminalEquipmentSpecification[];
    }
  | { type: "setCategoryName"; name: string }
  | { type: "setSpecificationId"; id: string }
  | { type: "setRackId"; id: string | null }
  | { type: "setRackPosition"; position: number | null }
  | { type: "setAccessAddressId"; id: string | null }
  | { type: "setUnitAddressId"; id: string | null }
  | { type: "setAdditionalAddressInformation"; text: string | null }
  | { type: "setManufacturerId"; id: string }
  | { type: "setName"; name: string }
  | {
      type: "setNearestAccessAddresses";
      nearestAccessAddresses: NearestAccessAddress[];
    }
  | { type: "setRacks"; racks: Rack[] }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setTerminalEquipment":
      return { ...state, terminalEquipment: action.terminalEquipment };
    case "setManufacturers":
      return { ...state, manufacturers: action.manufacturers };
    case "setTerminalEquipmentSpecifications":
      return {
        ...state,
        terminalEquipmentSpecifications: action.specifications,
      };
    case "setCategoryName":
      return { ...state, categoryName: action.name };
    case "setSpecificationId":
      return { ...state, specificationId: action.id };
    case "setManufacturerId":
      return { ...state, manufacturerId: action.id };
    case "setName":
      return { ...state, name: action.name };
    case "setAccessAddressId":
      return { ...state, accessAddressId: action.id, unitAddressId: null };
    case "setUnitAddressId":
      return { ...state, unitAddressId: action.id };
    case "setAdditionalAddressInformation":
      return { ...state, additionalAddressInformation: action.text };
    case "setRackId":
      return { ...state, rackId: action.id };
    case "setRackPosition":
      return { ...state, rackPosition: action.position };
    case "setNearestAccessAddresses":
      return {
        ...state,
        nearestAccessAddresses: action.nearestAccessAddresses,
      };
    case "setRacks":
      return { ...state, racks: action.racks };
    case "reset":
      return initialState;
    default:
      throw new Error(
        `No action found of type: '${
          (action as any)?.type ?? "has no action type"
        }'`
      );
  }
}

interface EditTerminalEquipmentProps {
  terminalEquipmentId: string;
  routeNodeId: string;
}

function EditTerminalEquipment({
  terminalEquipmentId,
  routeNodeId,
}: EditTerminalEquipmentProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();
  const client = useClient();

  useEffect(() => {
    if (!terminalEquipmentId) return;
    queryTerminalEquipmentDetails(client, terminalEquipmentId)
      .then((r) => {
        const terminalEquipment = r.data?.utilityNetwork.terminalEquipment;
        if (terminalEquipment) {
          dispatch({
            type: "setTerminalEquipment",
            terminalEquipment: terminalEquipment,
          });
          dispatch({
            type: "setCategoryName",
            name: terminalEquipment.specification.category,
          });
          dispatch({
            type: "setSpecificationId",
            id: terminalEquipment.specification.id,
          });
          dispatch({
            type: "setManufacturerId",
            id: terminalEquipment.manufacturer?.id ?? "",
          });
          dispatch({
            type: "setName",
            name: terminalEquipment.name,
          });
          dispatch({
            type: "setAccessAddressId",
            id: terminalEquipment.addressInfo?.accessAddress?.id ?? null,
          });
          dispatch({
            type: "setUnitAddressId",
            id: terminalEquipment.addressInfo?.unitAddress?.id ?? null,
          });
          dispatch({
            type: "setAdditionalAddressInformation",
            text: terminalEquipment.addressInfo?.remark ?? null,
          });
          dispatch({
            type: "setRackId",
            id: terminalEquipment.subrackPlacementInfo?.rackId ?? null,
          });
          dispatch({
            type: "setRackPosition",
            position:
              terminalEquipment.subrackPlacementInfo?.startUnitPosition ?? null,
          });
        } else {
          toast.error(t("ERROR"));
        }
      })
      .catch((r) => {
        console.error(r);
        toast.error(t("ERROR"));
      });
  }, [terminalEquipmentId, dispatch, client, t]);

  useEffect(() => {
    queryTerminalEquipmentSpecifications(client)
      .then((r) => {
        if (r.data?.utilityNetwork) {
          const { manufacturers, terminalEquipmentSpecifications } =
            r.data.utilityNetwork;
          dispatch({
            type: "setTerminalEquipmentSpecifications",
            specifications: terminalEquipmentSpecifications,
          });
          dispatch({
            type: "setManufacturers",
            manufacturers: manufacturers,
          });
        } else {
          toast.error(t("ERROR"));
        }
      })
      .catch((r) => {
        console.error(r);
        toast.error(t("ERROR"));
      });
  }, [dispatch, t, client]);

  useEffect(() => {
    if (!routeNodeId) return;

    queryNearestAccessAddresses(client, routeNodeId)
      .then((r) => {
        const nearestAccessAddresses =
          r.data?.addressService.nearestAccessAddresses;
        if (nearestAccessAddresses) {
          dispatch({
            type: "setNearestAccessAddresses",
            nearestAccessAddresses: nearestAccessAddresses,
          });
        } else {
          toast.error(t("ERROR"));
        }
      })
      .catch((r) => {
        console.error(r);
        toast.error(t("ERROR"));
      });
  }, [routeNodeId, client, t, dispatch]);

  useEffect(() => {
    if (!routeNodeId) return;

    queryRacks(client, routeNodeId)
      .then((r) => {
        const racks = r.data?.utilityNetwork.racks;
        if (racks) {
          dispatch({ type: "setRacks", racks: racks });
        } else {
          toast.error(t("ERROR"));
        }
      })
      .catch((r) => {
        console.error(r);
        toast.error(t("ERROR"));
      });
  }, [routeNodeId, dispatch, client, t]);

  const categoryOptions = useMemo<SelectOption[]>(() => {
    if (!state.terminalEquipment || !state.terminalEquipmentSpecifications)
      return [];

    return categoryToOptions(
      state.terminalEquipmentSpecifications,
      state?.terminalEquipment.specification.isRackEquipment
    );
  }, [state.terminalEquipment, state.terminalEquipmentSpecifications]);

  const specificationOptions = useMemo<SelectOption[]>(() => {
    if (
      !state.terminalEquipmentSpecifications ||
      !state.categoryName ||
      !state.terminalEquipment
    )
      return [];

    return specificationToOptions(
      state.terminalEquipmentSpecifications,
      state.categoryName,
      state.terminalEquipment.specification.isRackEquipment
    );
  }, [
    state.terminalEquipmentSpecifications,
    state.categoryName,
    state.terminalEquipment,
  ]);

  const manufacturerOptions = useMemo<SelectOption[]>(() => {
    if (!state.manufacturers || !state.terminalEquipmentSpecifications)
      return [];

    return [
      { text: t("UNSPECIFIED"), value: "", key: "-1" },
      ...manufacturerToOptions(
        state.manufacturers,
        state.terminalEquipmentSpecifications.find(
          (x) => x.id === state.specificationId
        )?.manufacturerRefs ?? []
      ),
    ];
  }, [
    state.manufacturers,
    state.terminalEquipmentSpecifications,
    state.specificationId,
    t,
  ]);

  const accessAddresses = useMemo<SelectOption[]>(() => {
    if (!state.nearestAccessAddresses) return [];

    const defaultList: SelectOption[] = [
      {
        text: t("SELECT_ACCESS_ADDRESS"),
        value: "",
        key: "SELECT_ACCESS_ADDRESS",
      },
    ];

    const options = state.nearestAccessAddresses
      .sort((x, y) => x.distance - y.distance)
      .map((x) => accessAddressToOption(x, t));

    // We do this because there is an issue
    // where unit address has an id but no labels and its the only one
    if (options.length === 1) {
      return [
        {
          text: t("SELECT_ACCESS_ADDRESS"),
          value: options[0].value,
          key: "SELECT_ACCESS_ADDRESS",
        },
      ];
    }

    return defaultList.concat(options);
  }, [state.nearestAccessAddresses, t]);

  const unitAddressOptions = useMemo<SelectOption[]>(() => {
    if (!state.nearestAccessAddresses) return [];

    const defaultList: SelectOption[] = [
      {
        text: t("SELECT_UNIT_ADDRESS"),
        value: "",
        key: "SELECT_UNIT_ADDRESS",
      },
    ];

    const options =
      state.nearestAccessAddresses
        .find((x) => x.accessAddress.id === state.accessAddressId)
        ?.accessAddress.unitAddresses.sort((x, y) =>
          x.externalId > y.externalId ? 1 : -1
        )
        .map(unitAddressToOption) ?? [];

    return defaultList.concat(options);
  }, [state.nearestAccessAddresses, state.accessAddressId, t]);

  const rackOptions = useMemo<SelectOption[]>(() => {
    return state.racks ? rackToOption(state.racks) : [];
  }, [state.racks]);

  const executeUpdateTerminalEquipment = () => {
    if (state.terminalEquipment?.id && state.specificationId) {
      updateTerminalEquipment(client, {
        terminalEquipmentId: terminalEquipmentId,
        terminalEquipmentSpecificationId: state.specificationId,
        manufacturerId:
          state.manufacturerId?.length !== 0 ? state.manufacturerId : null,
        namingInfo: {
          name: state.name,
        },
        addressInfo: state.terminalEquipment.specification.isAddressable
          ? {
              accessAddressId: state.accessAddressId,
              unitAddressId:
                state.unitAddressId?.length !== 0 ? state.unitAddressId : null,
              remark:
                state.additionalAddressInformation?.length !== 0
                  ? state.additionalAddressInformation
                  : null,
            }
          : null,
        rackId: state.terminalEquipment.specification.isRackEquipment
          ? state.rackId
          : null,
        rackStartUnitPosition: state.terminalEquipment.specification
          .isRackEquipment
          ? state.rackPosition
          : null,
      })
        .then((r) => {
          if (r.data?.terminalEquipment.updateProperties.errorCode) {
            toast.error(
              t(r.data?.terminalEquipment.updateProperties.errorCode ?? "ERROR")
            );
            console.error(
              r.data.terminalEquipment.updateProperties.errorMessage
            );
          }
        })
        .catch(() => {
          toast.error(t("ERROR"));
        });
    } else {
      toast.error(t("ERROR"));
      console.error("Missing ");
    }
  };

  if (
    !state.terminalEquipment ||
    !state.specificationId ||
    !state.categoryName ||
    !state.racks
  )
    return <></>;

  return (
    <div className="edit-terminal-equipment">
      <div className="full-row-group">
        <div className="full-row">
          <LabelContainer text={`${t("CATEGORY")}:`}>
            <SelectMenu
              onSelected={() => {}}
              options={categoryOptions}
              selected={state.categoryName}
              disabled={true}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("SPECIFICATION")}:`}>
            <SelectMenu
              onSelected={(x) =>
                dispatch({ type: "setSpecificationId", id: x as string })
              }
              options={specificationOptions}
              selected={state.specificationId}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("MANUFACTURER")}:`}>
            <SelectMenu
              onSelected={(x) =>
                dispatch({ type: "setManufacturerId", id: x as string })
              }
              options={manufacturerOptions}
              selected={state.manufacturerId ?? ""}
            />
          </LabelContainer>
        </div>
        <div className="full-row">
          <LabelContainer text={`${t("NAME")}:`}>
            <TextBox
              value={state.name ?? ""}
              setValue={(x) => dispatch({ type: "setName", name: x })}
            />
          </LabelContainer>
        </div>
      </div>

      {state.terminalEquipment.specification.isRackEquipment && (
        <div className="full-row-group">
          <div className="full-row">
            <LabelContainer text={`${t("RACK")}:`}>
              <SelectMenu
                onSelected={(x) =>
                  dispatch({ type: "setRackId", id: x as string })
                }
                options={rackOptions}
                selected={state.rackId ?? ""}
              />
            </LabelContainer>
          </div>

          <div className="full-row">
            <LabelContainer text={`${t("RACK_UNIT")}:`}>
              <NumberPicker
                value={state.rackPosition ?? 0}
                minValue={0}
                maxValue={100}
                setValue={(x) =>
                  dispatch({ type: "setRackPosition", position: x })
                }
              />
            </LabelContainer>
          </div>
        </div>
      )}

      {state.terminalEquipment.specification.isAddressable && (
        <div className="block">
          <p className="block-title">{t("ADDRESS_INFORMATION")}</p>
          <div className="full-row">
            <SelectMenu
              options={accessAddresses ?? []}
              onSelected={(x) =>
                dispatch({
                  type: "setAccessAddressId",
                  id: x?.toString() ?? "",
                })
              }
              selected={state.accessAddressId ?? ""}
              enableSearch={true}
            />
          </div>
          <div className="full-row">
            <SelectMenu
              options={unitAddressOptions ?? []}
              onSelected={(x) =>
                dispatch({ type: "setUnitAddressId", id: x?.toString() ?? "" })
              }
              selected={state.unitAddressId ?? ""}
              enableSearch={true}
            />
          </div>
          <div className="full-row">
            <TextBox
              placeHolder={t("ADDITIONAL_ADDRESS_INFORMATION")}
              setValue={(x) =>
                dispatch({ type: "setAdditionalAddressInformation", text: x })
              }
              value={state.additionalAddressInformation ?? ""}
            />
          </div>
        </div>
      )}

      <div className="full-row">
        <DefaultButton
          onClick={() => executeUpdateTerminalEquipment()}
          innerText={t("UPDATE")}
          disabled={false}
        />
      </div>
    </div>
  );
}

export default EditTerminalEquipment;