interface TagMenuProps {
  tags: string[];
}

function TagMenu({ tags }: TagMenuProps) {
  return (
    <div className="tag-menu">
      {tags.map((x) => (
        <div className="tag-menu-line" key={x}>
          {x} <span className="tag-menu-line-remove">x</span>
        </div>
      ))}
      <div className="tag-menu-new-tag">
        <span className="tag-menu-new-tag-add">+</span>
      </div>
    </div>
  );
}

export default TagMenu;
