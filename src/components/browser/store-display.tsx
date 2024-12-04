import { cn } from "@/lib/utils";
import { useApplicationState, ZarrStore, ZarrTree, ZarrView } from "@/state";
import { Box, ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";

interface IStoreDisplayProps {
  store: ZarrStore;
}

interface ITreeNodeProps {
  node: ZarrTree;
  uri: string;
  level?: number;
  addViewer: (viewerSpec: ZarrView) => void;
}

const TreeNode: React.FC<ITreeNodeProps> = ({
  node,
  uri,
  level = 0,
  addViewer,
}) => {
  const numViewers = useApplicationState((state) => state.viewers.length);
  const treeExpanded = useApplicationState(
    (state) => state.ui.browser.state === "expanded"
  );
  const setFocusData = useApplicationState((state) => state.setFocusData);
  const [expanded, setExpanded] = useState(false);
  const type = node.type;
  const canAddViewer = numViewers < 2;

  const toggleExpand = () => {
    if (node.type === "group") {
      setExpanded(!expanded);
    } else if (canAddViewer) {
      const numDims = node.ref.shape.length;
      const viewSpec: ZarrView = {
        state: "uninitialized",
        drawing: false,
        store: uri,
        path: node.path,
        selection: node.ref.shape.map((length) => 0),
        mapping: {
          x: numDims > 0 ? numDims - 1 : undefined,
          y: numDims > 1 ? numDims - 2 : undefined,
        },
      };

      addViewer(viewSpec);
      setFocusData({
        region: "selector",
        viewerIdx: numViewers,
      });
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center",
          `ml-${2 * level}`,
          canAddViewer || type === "group" ? "hover:bg-gray-200" : ""
        )}
        key={`subtree-${node.path}`}
        onClick={toggleExpand}
      >
        <div
          className={cn(
            "flex items-center text-center m-2 w-[30px] h-[30px] rounded-[100%] ",
            type === "array"
              ? canAddViewer
                ? "bg-blue-300 text-blue-700"
                : "bg-gray-300 text-gray-500"
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
        {treeExpanded && (
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
        )}
      </div>
      {treeExpanded &&
        expanded &&
        Object.entries(node.children).map(([key, subtree], i) => {
          return (
            <TreeNode
              key={`tree-node-${level}-${i}`}
              uri={uri}
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
  const addViewer = useApplicationState((store) => store.addViewer);

  return (
    <div className="border-2 rounded-md mb-2">
      <TreeNode
        node={store.tree}
        level={0}
        addViewer={addViewer}
        uri={store.uri}
      />
    </div>
  );
}
