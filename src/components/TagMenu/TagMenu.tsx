interface Tag {
  text: string;
  value: string;
  added: boolean;
}

interface TagMenuProps {
  tags: Tag[];
}

function TagMenu({ tags }: TagMenuProps) {
  return (
    <div className="tag-menu">
      {tags
        .filter((x) => x.added)
        .map(({ text, value }) => (
          <div className="tag-menu-line" key={value}>
            {text} <span className="tag-menu-line-remove">x</span>
          </div>
        ))}
      <div className="tag-menu-new-tag">
        <span className="tag-menu-new-tag-add">+</span>
      </div>
    </div>
  );
}

export default TagMenu;
