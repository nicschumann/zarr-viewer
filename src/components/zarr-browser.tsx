import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Database,
  Square,
  Info,
} from "lucide-react";
import { useApplicationState } from "@/state";

type ZarrEmpty = {
  type: "empty";
  children: { [name: string]: ZarrTree };
};

type ZarrGroup = {
  type: "group";
  path: string;
  name: string;
  ref: any;
  children: { [name: string]: ZarrTree };
};

type ZarrArray = {
  type: "array";
  name: string;
  path: string;
  ref: any;
  children: { [name: string]: ZarrTree };
};

type ZarrTree = ZarrGroup | ZarrArray | ZarrEmpty;

type HTTPZarrStore = {
  type: "http";
  uri: string;
  loaded: boolean;
  tree: ZarrTree;
};

interface ZarrBrowserProps {
  store: HTTPZarrStore;
}

const ZarrBrowser: React.FC<ZarrBrowserProps> = ({ store }) => {
  const addViewer = useApplicationState((store) => store.addViewer);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (
      store.loaded &&
      (store.tree.type === "group" || store.tree.type === "empty")
    ) {
      setExpanded(new Set([""]));
    }
  }, [store.loaded]);

  const NodeIcon = ({ type }: { type: ZarrTree["type"] }) => {
    switch (type) {
      case "group":
        return <Folder className="w-4 h-4 text-blue-500 mr-2" />;
      case "array":
        return <Database className="w-4 h-4 text-green-500 mr-2" />;
      case "empty":
        return <Square className="w-4 h-4 text-gray-400 mr-2" />;
      default:
        return null;
    }
  };

  const TreeNode: React.FC<{
    node: ZarrTree;
    level?: number;
    nodePath: string;
  }> = ({ node, level = 0, nodePath }) => {
    const isExpanded = expanded.has(nodePath);
    const hasChildren = Object.keys(node.children).length > 0;

    const openViewer = () => {
      if (node.type == "array") {
        console.log(node);
        addViewer({
          path: node.path,
          selection: [421192, 0, [12600, 12900], [5600, 5900]],
          mapping: [3, 2],
        });
      }
    };

    const toggleExpand = () => {
      const newExpanded = new Set(expanded);
      if (isExpanded) {
        newExpanded.delete(nodePath);
      } else {
        newExpanded.add(nodePath);
      }
      setExpanded(newExpanded);
    };

    return (
      <>
        <div
          onClick={openViewer}
          className="border-t border-gray-100 first:border-t-0"
        >
          <div
            className="flex items-center p-2 hover:bg-gray-50"
            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          >
            {hasChildren ? (
              <button
                onClick={toggleExpand}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <NodeIcon type={node.type} />

            <span className="text-sm font-medium">
              {node.type === "empty" ? "/" : node.name}
            </span>
            {node.type === "array" && (
              <>
                <span className="text-xs text-gray-500 ml-2">
                  {node.ref.dtype}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {node.ref.chunks.length} dims
                </span>
              </>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {Object.entries(node.children)
              .sort(([, a], [, b]) => {
                if (a.type !== b.type) {
                  if (a.type === "group") return -1;
                  if (b.type === "group") return 1;
                  if (a.type === "array") return -1;
                  if (b.type === "array") return 1;
                }
                return (a.type === "empty" ? "" : a.name).localeCompare(
                  b.type === "empty" ? "" : b.name
                );
              })
              .map(([childName, childNode]) => (
                <TreeNode
                  key={childName}
                  node={childNode}
                  level={level + 1}
                  nodePath={`${nodePath}/${childName}`}
                />
              ))}
          </div>
        )}
      </>
    );
  };

  if (!store.loaded) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div>
        <TreeNode node={store.tree} nodePath="" />
      </div>
    </div>
  );
};

export default ZarrBrowser;
