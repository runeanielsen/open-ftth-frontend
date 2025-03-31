import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MultiLineTextBox from "../../../components/MultiLineTextbox";
import DefaultButton from "../../../components/DefaultButton";

interface TagInfo {
  id: string;
  name: string;
  comment?: string;
  tags: string[];
}

const fiberRackTagData: TagInfo[] = [
  {
    id: "a1b2c3d4-e5f6-4789-90ab-cdef01234567",
    name: "Data Center A - Rack 01",
    comment: "Main fiber distribution rack in Data Center A.",
    tags: ["data center", "location a", "rack 01", "fiber distribution"],
  },
  {
    id: "f8e7d6c5-b4a3-4210-8fed-cba987654321",
    name: "Building B - Floor 2 West Side",
    comment:
      "Intermediate fiber patch panel rack on the west side of the second floor in Building B.",
    tags: ["building b", "floor 2", "west", "fiber patch panel"],
  },
  {
    id: "11223344-5566-4778-8990-aabbccddeeff",
    name: "Main Distribution Frame (MDF)",
    comment: "Central MDF for the entire network infrastructure.",
    tags: ["mdf", "main distribution", "central", "core network"],
  },
  {
    id: "fedcba98-7654-4321-0fed-cba987654320",
    name: "Server Room 3 - Equipment Rack",
    comment: "Rack containing fiber termination for servers in Server Room 3.",
    tags: ["server room 3", "equipment rack", "fiber termination", "servers"],
  },
  {
    id: "99887766-5544-4332-2110-aabbccdd00ff",
    name: "Building C - South Wing Interconnect",
    comment:
      "Rack facilitating fiber connections between different parts of the south wing in Building C.",
    tags: ["building c", "south wing", "interconnect", "fiber backbone"],
  },
  {
    id: "00112233-4455-4667-8899-aabbccddeeff",
    name: "Telecom Closet 1 - Zone A",
    comment:
      "Fiber termination point for users in Zone A connected to Telecom Closet 1.",
    tags: ["telecom closet", "zone a", "user connectivity", "fiber access"],
  },
  {
    id: "aabbccdd-eeff-4012-3456-7890abcdef0123",
    name: "Outdoor Fiber Enclosure #5",
    comment:
      "Weatherproof enclosure containing fiber splices and connections in the outdoor network.",
    tags: ["outdoor", "enclosure", "fiber splice", "weatherproof"],
  },
];

function EditTags() {
  const { t } = useTranslation();

  const [tags, setTags] = useState<Record<string, TagInfo> | null>(null);

  useEffect(() => {
    const x = fiberRackTagData.reduce<Record<string, TagInfo>>((acc, x) => {
      acc[x.id] = x;
      return acc;
    }, {});
    setTags(x);
  }, []);

  if (tags === null) {
    return <></>;
  }

  return (
    <div className="tag-view">
      <div className="full-row">
        <div className="edit-tags-container">
          <div className="edit-tags-container-header">
            <div className="edit-tags-container-header-item">{t("NAME")}</div>
            <div className="edit-tags-container-header-item">
              {t("COMMENT")}
            </div>
            <div className="edit-tags-container-header-item">{t("TAGS")}</div>
          </div>
          <div className="edit-tags-container-body">
            <div className="disconnect-fiber-editor-container-body-line"></div>
            {Object.values(tags).map((x) => (
              <div className="edit-tags-container-body-line" key={x.id}>
                <div className="disconnect-fiber-editor-container-body-line-item">
                  {x.name}
                </div>
                <div className="disconnect-fiber-editor-container-body-line-item">
                  <MultiLineTextBox
                    rows={5}
                    value={x.comment ?? ""}
                    setValue={() => {}}
                  />
                </div>
                <div className="disconnect-fiber-editor-container-body-line-item">
                  {x.tags.join(" | ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="full-row center-items">
        <DefaultButton
          onClick={() => {}}
          innerText={t("UPDATE")}
          maxWidth={"400px"}
        />
      </div>
    </div>
  );
}

export default EditTags;
