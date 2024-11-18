import { useApplicationState, ZarrTree, ZarrViewer } from "@/state";
import React, { useRef, useEffect } from "react";
import { Regl } from "regl";

import { get, slice } from "@zarrita/indexing";

export default function ArrayRenderer({ viewer }: { viewer: ZarrViewer }) {
  const store = useApplicationState((state) => state.store);
  const baseCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!baseCanvas.current) return;

    baseCanvas.current.width = window.innerWidth;
    baseCanvas.current.height = window.innerHeight;

    // @ts-ignore
    const regl: Regl = require("regl")({
      canvas: baseCanvas.current,
      attributes: { preserveDrawingBuffer: true },
      extensions: [
        "OES_texture_float",
        "OES_texture_float_linear",
        "OES_element_index_uint",
      ],
    });

    console.log(store.keys);
    console.log(viewer.path);
    const dataref = store.keys[viewer.path];

    if (typeof dataref !== "undefined" && dataref.type === "array") {
      get(dataref.ref, [
        812000,
        0,
        slice(5500, 5900),
        slice(12300, 12800),
      ]).then((data) => {
        console.log(data);
      });
    }

    // Resize Handler..

    // const resizeHandler = () => {
    //   if (baseCanvas.current == null) return;
    // };

    // window.addEventListener("resize", resizeHandler);

    // return () => {
    //   window.removeEventListener("resize", resizeHandler);
    // };
  }, []);

  return (
    <div className="relative top-0 left-0">
      <canvas ref={baseCanvas} className="h-screen w-screen" />
      <div className="absolute bottom-0 flex">
        <div className="mx-auto">{viewer.path}</div>
      </div>
    </div>
  );
}
