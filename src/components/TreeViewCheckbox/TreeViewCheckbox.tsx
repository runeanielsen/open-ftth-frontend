import Checkbox from "../Checkbox";

export interface TreeNode {
  id: string;
  label: string;
  value: string | null;
  nodes: TreeNode[] | null;
  selected: boolean;
  description: string | null;
}

function NodeSelectionRow(
  treeNode: TreeNode,
  onClick: (treeNode: TreeNode) => void
) {
  return (
    <div className="node-selection-row">
      <Checkbox
        checked={treeNode.selected}
        onChange={() => onClick(treeNode)}
        value={treeNode.id}
        key={treeNode.id}
      />
      <p>{treeNode.label}</p>
      <p>{treeNode.description}</p>
    </div>
  );
}

function renderNodeTree(
  node: TreeNode,
  onClick: (treeNode: TreeNode) => void
): JSX.Element {
  return (
    <div className="node-block" key={node.id}>
      {NodeSelectionRow(node, onClick)}
      {node.nodes?.map((x) => renderNodeTree(x, onClick))}
    </div>
  );
}

interface TreeViewCheckboxProps {
  treeNode: TreeNode;
  onCheckboxChange: (treeNode: TreeNode) => void;
  maxHeight?: number;
}

function TreeViewCheckbox({
  treeNode,
  onCheckboxChange,
  maxHeight,
}: TreeViewCheckboxProps) {
  return (
    <div
      style={{ maxHeight: maxHeight ?? "auto" }}
      className="tree-view-check-box"
    >
      {renderNodeTree(treeNode, onCheckboxChange)}
    </div>
  );
}

export default TreeViewCheckbox;