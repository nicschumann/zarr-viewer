import { cn } from "@/lib/utils";
import { useApplicationState, ZarrStore, ZarrTree, ZarrViewer } from "@/state";
import { Box, Boxes, ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";

interface IStoreDisplayProps {
  store: ZarrStore;
}

const TreeNode: React.FC<{
  node: ZarrTree;
  level?: number;
  addViewer: (viewerSpec: ZarrViewer) => void;
}> = ({ node, level = 0, addViewer }) => {
  const [expanded, setExpanded] = useState(false);
  const type = node.type;

  const toggleExpand = () => {
    if (node.type === "group") {
      setExpanded(!expanded);
    } else {
      console.log(node.path);
      /**
       * NOTE(Nic): you can add a viewer for this array here.
       * In the future, this would first display and focus a selector,
       * and the selector would construct the viewer...
       */
    }
  };

  return (
    <>
      <div
        className={cn("flex items-center hover:bg-gray-200", `ml-${2 * level}`)}
        key={`subtree-${node.path}`}
        onClick={toggleExpand}
      >
        <div
          className={cn(
            "flex items-center text-center m-2 w-[30px] h-[30px] rounded-[100%] ",
            type === "array"
              ? "bg-blue-300 text-blue-700"
              : "bg-green-300 text-green-700 cursor-pointer "
          )}
        >
          <div className="text-md font-bold mx-auto">
            {node.type === "array" && (
              <span>
                <Box width={20} />
              </span>
            )}
            {node.type === "group" && (
              <span>
                {!expanded && <ChevronRight className="ml-[2px]" width={20} />}
                {expanded && <ChevronDown className="mt-[2px]" width={20} />}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm flex py-2 px-3">
          <h2 className="font-bold">{node.name}</h2>
          {node.type === "array" && (
            <>
              <div className="text-gray-500 ml-2">{node.ref.dtype}</div>
              <div className="text-gray-500 ml-2">
                [{node.ref.shape.join(", ")}]
              </div>
            </>
          )}
        </div>
      </div>
      {expanded &&
        Object.entries(node.children).map(([key, subtree], i) => {
          return (
            <TreeNode
              key={`tree-node-${level}-${i}`}
              node={subtree}
              level={level + 1}
              addViewer={addViewer}
            />
          );
        })}
    </>
  );
};

export default function StoreDisplay({ store }: IStoreDisplayProps) {
  const tree = store.tree;
  const addViewer = useApplicationState((store) => store.addViewer);

  return (
    <div className="border-2 rounded-md mb-2">
      <TreeNode node={tree} level={0} addViewer={addViewer} />
    </div>
  );
}
