import CheckBox from "../Checkbox";
import { useState } from "react";

interface Tag {
  text: string;
  value: string;
  added: boolean;
}

interface TagMenuProps {
  tags: Tag[];
  showMenu: boolean;
}

function TagMenu({ tags, showMenu }: TagMenuProps) {
  const [tagSelectMenuOpen, setTagSelectMenuOpen] = useState(false);

  return (
    <div className="tag-menu">
      {!tagSelectMenuOpen && (
        <>
          {tags
            .filter((x) => x.added)
            .map(({ text, value }) => (
              <div className="tag-menu-line" key={value}>
                {text} <span className="tag-menu-line-remove">x</span>
              </div>
            ))}
          <div
            className="tag-menu-new-tag"
            onClick={() => setTagSelectMenuOpen((prevValue) => !prevValue)}
          >
            <span className="tag-menu-new-tag-add">+</span>
          </div>
        </>
      )}
      {tagSelectMenuOpen && (
        <div className="tag-menu-select-menu">
          <div className="tag-menu-select-menu-header">
            <span
              onClick={() => setTagSelectMenuOpen(false)}
              className="tag-menu-select-menu-header-exit-button"
            >
              x
            </span>
          </div>
          <div className="tag-menu-select-menu-body">
            {tags.map((x) => (
              <div className="tag-menu-select-menu-item" key={x.value}>
                <CheckBox
                  checked={x.added}
                  value={x.value}
                  onChange={() => {}}
                />
                {x.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TagMenu;
