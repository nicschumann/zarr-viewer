import React, { useRef } from "react";
import ArraySelector from "../selector/array-selector";
import { ZarrView } from "@/state";
import ArrayRenderer from "./array-renderer";

const margin = `1em`;

type IArrayEditorProps = {
  // informs this component how much width it needs to reserve for the sidebar.
  sidebarWidth: string;
  viewer: ZarrView;
  viewerIdx: number;
};

export default function ArrayEditor({
  viewer,
  viewerIdx,
  sidebarWidth,
}: IArrayEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="h-screen relative"
      style={{ width: `calc(100vw - (${sidebarWidth}))` }}
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
            className="absolute top-[50%] left-[50%]"
            style={{ transform: `translate(-50%,-50%)` }}
          />
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
