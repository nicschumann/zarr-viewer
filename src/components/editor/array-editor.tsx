import React, { useRef } from "react";
import ArraySelector from "../selector/array-selector";
import { useApplicationState, ZarrView } from "@/state";
import ArrayRenderer from "./array-renderer";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const margin = `1em`;

type IArrayEditorProps = {
  // informs this component how much width it needs to reserve for the sidebar.
  sidebarWidth: string;
  viewer: ZarrView;
  viewerIdx: number;
  numViewers: number;
};

export default function ArrayEditor({
  viewer,
  viewerIdx,
  sidebarWidth,
  numViewers,
}: IArrayEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const removeViewer = useApplicationState((state) => state.removeViewer);

  const handleCloseClick = () => {
    removeViewer(viewerIdx);
  };

  return (
    <div
      className="h-screen relative"
      style={{ width: `calc(${100 / numViewers}%)` }}
    >
      <div className="absolute w-full h-full top-0 left-0 ">
        <div
          ref={parentRef}
          className="relative my-2 border-2 border-gray-300 rounded-xl bg-white"
          style={{
            margin: `${margin}`,
            height: `calc(100% - 2 * ${margin})`,
          }}
        >
          {/* this is where the rendering component should go, with a ref to its parent container so it can set its size properly. */}

          <ArrayRenderer viewer={viewer} parentElement={parentRef} />

          <ArraySelector
            viewer={viewer}
            viewerIdx={viewerIdx}
            active={true}
            className={cn(
              viewer.drawing
                ? "absolute top-[100%] left-[50%]"
                : "absolute top-[50%] left-[50%]"
            )}
            style={{
              transform: viewer.drawing
                ? `translate(-50%,-102%)`
                : `translate(-50%, -50%)`,
            }}
          />
          <button
            onClick={handleCloseClick}
            className="absolute flex top-2 right-2 bg-gray-200 text-gray-800 rounded-full hover:text-red-600 p-2"
          >
            <X />
          </button>
          <div className="absolute flex bottom-2 right-2">
            <span className="bg-red-300 p-1 px-3 rounded text-xs">
              {viewer.drawing ? "drawing" : "paused"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
