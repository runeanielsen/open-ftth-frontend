import {
  useContext,
  useLayoutEffect,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { v4 as uuidv4 } from "uuid";
import SelectListView, { BodyItem } from "../../../components/SelectListView";
import SelectMenu, { SelectOption } from "../../../components/SelectMenu";
import DefaultButton from "../../../components/DefaultButton";
import Loading from "../../../components/Loading";
import { useQuery, useMutation } from "urql";
import {
  UtilityNetworkResponse,
  Manufacturer,
  NodeContainerSpecification,
  NODE_CONTAINER_SPECIFICATIONS_QUERY,
  PlaceNodeContainerResponse,
  PLACE_NODE_CONTAINER_IN_ROUTE_NETWORK,
  PlaceNodeContainerParameters,
} from "./AddContainerGql";
import { MapContext } from "../../../contexts/MapContext";
import { toast } from "react-toastify";

const getFilteredSpanEquipmentSpecifications = (
  specifications: NodeContainerSpecification[],
  selectedCategory: string | number | undefined,
) => {
  const bodyItems = specifications.map<BodyItem>((x) => {
    return {
      rows: [{ id: 0, value: x.description }],
      id: x.id,
    };
  });

  return bodyItems.filter((x) => {
    return (
      specifications.find((y) => {
        return y.id === x.id;
      })?.category === selectedCategory
    );
  });
};

const getFilteredManufacturers = (
  manufacturers: Manufacturer[],
  selectedNodeContainerSpecification: string | number | undefined,
  nodeContainerSpecifications: NodeContainerSpecification[],
  t: TFunction<"translation">,
) => {
  if (
    !manufacturers ||
    manufacturers.length === 0 ||
    !selectedNodeContainerSpecification
  ) {
    return [];
  }

  const bodyItems = manufacturers.map<BodyItem>((x) => {
    return {
      rows: [{ id: 0, value: x.name }],
      id: x.id,
    };
  });

  const spanEquipment = nodeContainerSpecifications.find(
    (x) => x.id === selectedNodeContainerSpecification,
  );

  if (!spanEquipment) {
    throw new Error(
      `Could not find SpanEquipment on id ${selectedNodeContainerSpecification}`,
    );
  }

  const filtered =
    spanEquipment.manufacturerRefs === null ||
    spanEquipment.manufacturerRefs.length === 0
      ? bodyItems
      : bodyItems.filter((x) => {
          return spanEquipment.manufacturerRefs?.includes(x.id.toString());
        });

  const defaultValue = {
    rows: [{ id: 0, value: t("UNSPECIFIED") }],
    id: "",
  };

  return [defaultValue, ...filtered];
};

function AddContainer() {
  const { t } = useTranslation();
  const { identifiedFeature } = useContext(MapContext);
  const [selectedCategory, setSelectedCategory] = useState<
    string | number | undefined
  >();
  const [nodeContainerSpecifications, setNodeContainerSpecifications] =
    useState<NodeContainerSpecification[]>([]);
  const [
    selectedNodeContainerSpecification,
    setSelectedSpanEquipmentSpecification,
  ] = useState<string>();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");

  const [nodeContainerResult] = useQuery<UtilityNetworkResponse>({
    query: NODE_CONTAINER_SPECIFICATIONS_QUERY,
  });

  const [, placeNodeContainerMutation] =
    useMutation<PlaceNodeContainerResponse>(
      PLACE_NODE_CONTAINER_IN_ROUTE_NETWORK,
    );

  const filteredSpanEquipmentSpecifications = useMemo(
    () =>
      getFilteredSpanEquipmentSpecifications(
        nodeContainerSpecifications,
        selectedCategory,
      ),
    [nodeContainerSpecifications, selectedCategory],
  );

  const filteredManufactuers = useMemo(
    () =>
      getFilteredManufacturers(
        manufacturers,
        selectedNodeContainerSpecification,
        nodeContainerSpecifications,
        t,
      ),
    [
      manufacturers,
      selectedNodeContainerSpecification,
      nodeContainerSpecifications,
      t,
    ],
  );

  useEffect(() => {
    if (filteredSpanEquipmentSpecifications.length === 0) {
      return;
    }

    setSelectedSpanEquipmentSpecification(
      filteredSpanEquipmentSpecifications[0].id,
    );
  }, [
    filteredSpanEquipmentSpecifications,
    setSelectedSpanEquipmentSpecification,
  ]);

  useEffect(() => {
    if (filteredManufactuers.length === 0) {
      return;
    }

    const spanEquipment = nodeContainerSpecifications.find(
      (x) => x.id === selectedNodeContainerSpecification,
    );

    if (!spanEquipment) {
      throw new Error(
        `Could not find SpanEquipment on id ${selectedNodeContainerSpecification}`,
      );
    }

    if (
      spanEquipment.manufacturerRefs &&
      spanEquipment.manufacturerRefs.length > 1
    ) {
      setSelectedManufacturer(filteredManufactuers[1].id);
    } else {
      setSelectedManufacturer(filteredManufactuers[0].id);
    }
  }, [
    filteredManufactuers,
    setSelectedManufacturer,
    selectedNodeContainerSpecification,
  ]);

  useLayoutEffect(() => {
    if (!nodeContainerResult.data) return;

    const { nodeContainerSpecifications, manufacturers } =
      nodeContainerResult.data.utilityNetwork;

    if (!nodeContainerSpecifications || !manufacturers) return;

    setManufacturers(manufacturers);
    setNodeContainerSpecifications(nodeContainerSpecifications);
  }, [nodeContainerResult]);

  const placeNodeContainer = async () => {
    if (
      identifiedFeature?.id === null ||
      identifiedFeature?.type !== "RouteNode"
    ) {
      throw new Error("Selected feature is either null or not a RouteNode");
    }

    const parameters: PlaceNodeContainerParameters = {
      routeNodeId: identifiedFeature.id,
      manufacturerId: selectedManufacturer === "" ? null : selectedManufacturer,
      nodeContainerId: uuidv4(),
      nodeContainerSpecificationId: selectedNodeContainerSpecification ?? "",
    };

    const { data } = await placeNodeContainerMutation(parameters);

    if (!data?.nodeContainer.placeNodeContainerInRouteNetwork.isSuccess) {
      toast.error(
        t(data?.nodeContainer.placeNodeContainerInRouteNetwork.errorCode ?? ""),
      );
    }
  };

  const categorySelectOptions = () => {
    const categoryOptions = nodeContainerSpecifications
      .map((x) => {
        return x.category;
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .map<SelectOption>((x) => {
        return {
          text: t(x),
          value: x,
        };
      });

    // If none is selected - select the first select option
    if (categoryOptions.length > 0 && !selectedCategory) {
      setSelectedCategory(categoryOptions[0].value);
    }

    return categoryOptions;
  };

  const selectCategory = (categoryId: string | number | undefined) => {
    if (selectedCategory === categoryId || selectCategory === undefined) return;

    setSelectedCategory(categoryId);
  };

  const selectNodeContainerSpecification = (specificationId: string) => {
    if (selectedNodeContainerSpecification === specificationId) return;

    setSelectedSpanEquipmentSpecification(specificationId);
  };

  if (nodeContainerResult.fetching) {
    return <Loading />;
  }

  return (
    <div className="add-container page-container">
      <div className="full-row">
        <SelectMenu
          options={categorySelectOptions()}
          removePlaceHolderOnSelect
          onSelected={selectCategory}
          selected={selectedCategory}
        />
      </div>
      <div className="full-row">
        <SelectListView
          maxHeightBody={"300px"}
          headerItems={[t("Specification")]}
          bodyItems={filteredSpanEquipmentSpecifications}
          selectItem={(x) => selectNodeContainerSpecification(x.id.toString())}
          selected={selectedNodeContainerSpecification}
        />
      </div>
      <div className="full-row">
        <SelectListView
          maxHeightBody={"300px"}
          headerItems={[t("Manufacturer")]}
          bodyItems={filteredManufactuers}
          selectItem={(x) => setSelectedManufacturer(x.id.toString())}
          selected={selectedManufacturer}
        />
      </div>
      <div className="full-row">
        <DefaultButton
          innerText={t("Place container")}
          onClick={() => placeNodeContainer()}
          disabled={
            !selectedManufacturer === undefined ||
            !selectedNodeContainerSpecification
              ? true
              : false
          }
        />
      </div>
    </div>
  );
}

export default AddContainer;
