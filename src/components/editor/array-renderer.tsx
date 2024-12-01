import React, { MutableRefObject, useEffect, useRef, useState } from "react";

import { mat3 } from "gl-matrix";
import create_regl, { Regl, Vec4 } from "regl";

import * as zarr from "zarrita";
import { get, slice } from "@zarrita/indexing";

import { CompiledShaders, compileShaders } from "@/renderer/compile";
import { TextureCache } from "@/renderer/texture-cache";
import { IndexType, useApplicationState, ZarrView } from "@/state";

type IArrayRendererProps = {
  viewer: ZarrView;
  parentElement: MutableRefObject<HTMLDivElement>;
};

type DataCache = {
  key: string;
  array: zarr.Chunk<any> | null;
  bounds: { min: number; max: number };
};

/**
 * Rendering helpers
 */
function makeKey(store: zarr.Array<any, any>, slice: IndexType[]): string {
  return `${store.path}-${slice.join("/")}`;
}

const getRegion = async (store: zarr.Array<any, any>, index: IndexType[]) => {
  const zarrIndex = index.map((value) => {
    if (typeof value === "number") return value;
    else if (value === null) {
      return slice(null);
    } else return slice(value[0], value[1]);
  });

  let chunk = await get(store, zarrIndex);

  /**
   * NOTE(Nic): for our testcases, this will always be a float32 array,
   * but this may break if the dtype is a BoolArray...
   */
  // TODO(Nic): remvoe
  // @ts-ignore
  const bounds = chunk.data.reduce(
    (prev, value) => ({
      min: Math.min(prev.min, value),
      max: Math.max(prev.max, value),
    }),
    { max: -Infinity, min: Infinity }
  );

  return { chunk, bounds };
};

const getRenderShape = (viewer: ZarrView): [number, number] | false => {
  const x = viewer.selection[viewer.mapping.x];
  const y = viewer.selection[viewer.mapping.y];

  const shape = [x, y]
    .filter((v) => v && typeof v === "object")
    .map((v) => v[1] - v[0]);

  console.log(shape);

  if (shape.length == 0) {
    // we don't want empty selections
    return false;
  }

  if (shape.reduce((a, b) => a || b < 1, false)) {
    // we don't want zero-length selections
    return false;
  }

  if (shape.length == 1) {
    // NOTE(Nic): 1D selections are okay in principle.
    // However, right now, I'm focusing on the 2D case.
    return false;
    // return [shape[0], 1];
  }

  if (shape.length == 2) {
    // 2D selections are good.
    return [shape[0], shape[1]];
  }

  return false;
};

function getViewportScaledArraySize(
  aspect: number,
  zoom: number,
  viewport: number[]
) {
  const length =
    (Math.min(viewport[0], viewport[1]) - 100) * window.devicePixelRatio;
  if (aspect >= 1.0) {
    return [length * zoom, (1 / aspect) * length * zoom];
  } else {
    return [aspect * length * zoom, length * zoom];
  }
}

const getMatrix = (aspect: number, zoom: number, viewport: number[]) => {
  const size_px = getViewportScaledArraySize(aspect, zoom, viewport);

  let scalefactors = [
    (2.0 * size_px[0]) / (viewport[0] * window.devicePixelRatio),
    (-2.0 * size_px[1]) / (viewport[1] * window.devicePixelRatio),
  ];

  // @ts-ignore
  const translation = mat3.fromTranslation([], [-0.5, -0.5]);
  // @ts-ignore
  const scaling = mat3.fromScaling([], scalefactors);
  // @ts-ignore
  return mat3.multiply([], scaling, translation);
};

export default function ArrayRenderer({
  parentElement,
  viewer,
}: IArrayRendererProps) {
  const stores = useApplicationState((state) => state.stores);

  /**
   * Deal with weird edgecase errors that shouldn't really happen in practice.
   */
  const store = stores[viewer.store];

  if (typeof store === "undefined") {
    return <div>store "{viewer.store}" is undefined!</div>;
  }

  const tree = store.keys[viewer.path];

  if (typeof tree === "undefined") {
    return <div>array "{viewer.path}" is undefined!</div>;
  }

  if (tree.type !== "array") {
    return <div>tree "{viewer.path}" is not an array!</div>;
  }

  // local rendering data
  const [currentChunk, setCurrentChunk] = useState<DataCache | null>(null);
  const [textures, setTextures] = useState<TextureCache | null>(null);
  const [shaders, setShaders] = useState<CompiledShaders | null>(null);
  const [regl, setRegl] = useState<Regl | null>(null);

  const baseCanvas = useRef<HTMLCanvasElement>(null);

  /**
   * This is called once per component lifetime. It sets up the local regl instance,
   * and compiles the shaders we need as well as a texture cache for that regl instance.
   */
  useEffect(() => {
    // if (viewer.state === "uninitialized") return;
    if (!baseCanvas.current) return;
    if (!parentElement.current) return;

    const rect = parentElement.current.getBoundingClientRect();

    baseCanvas.current.width = rect.width;
    baseCanvas.current.height = rect.height;

    // @ts-ignore
    const localRegl: Regl = create_regl({
      canvas: baseCanvas.current,
      attributes: { preserveDrawingBuffer: true },
      extensions: [
        "OES_texture_float",
        "OES_texture_float_linear",
        "OES_element_index_uint",
      ],
    });

    setRegl((_) => localRegl);
    setShaders((_) => compileShaders(localRegl));
    setTextures(new TextureCache(localRegl));

    const resizeObserver = new ResizeObserver(() => {
      const rect = parentElement.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set the canvas style size (CSS pixels)
      baseCanvas.current.style.width = `${rect.width}px`;
      baseCanvas.current.style.height = `${rect.height}px`;

      // Set the canvas internal size (actual pixels)
      baseCanvas.current.width = rect.width * dpr;
      baseCanvas.current.height = rect.height * dpr;

      // Update the WebGL viewport
      localRegl.poll();
    });

    resizeObserver.observe(parentElement.current);

    return () => {
      resizeObserver.disconnect();
      localRegl.destroy();
    };
  }, [parentElement.current]);

  /**
   * This useEffect is the drawing loop. It makes sure that the current
   */
  useEffect(() => {
    if (regl === null || shaders === null || parentElement.current === null)
      return;

    const renderShape = viewer.drawing ? getRenderShape(viewer) : false;

    // this key uniquely describes the array selection
    const key = makeKey(tree.ref, viewer.selection);

    /**
     * NOTE(Nic): let goodChunkForClouds = [421192, 0, 12600:12900, 5600:5900]
     */

    // if the viewer selection has changed, we better grab a new value!
    if (
      (currentChunk == null || currentChunk.key !== key) &&
      renderShape &&
      viewer.drawing
    ) {
      getRegion(tree.ref, viewer.selection).then((data) => {
        setCurrentChunk((_) => ({
          key,
          array: data.chunk,
          bounds: data.bounds,
        }));
      });
    }

    let clearColor: Vec4 = [0, 0, 0, 1];

    const renderLoopId = setInterval(() => {
      regl.clear({ depth: 1, color: clearColor });

      // NOTE(Nic):
      if (renderShape && currentChunk !== null) {
        try {
          // @ts-ignore If we read an integer array, this will fail.
          // TODO(Nic): we need a conversion routine that handles bring other dtypes over.
          const tex = textures.tex(currentChunk.array.data, renderShape);

          // update canvas if needed
          const { width, height } =
            parentElement.current.getBoundingClientRect();

          const aspect = renderShape[0] / renderShape[1];
          const zoom = 1;
          const matrix = getMatrix(aspect, zoom, [width, height]);
          const normalization = currentChunk.bounds.max;

          // console.log(width, height);

          // NOTE(Nic): this is for drawing 2D selections only...

          try {
            shaders.renderSlice({
              u_chunk: tex,
              u_matrix: matrix,
              u_normalization: normalization,
              u_resolution: renderShape,
            });
          } catch (e) {
            console.error("render issue");
            clearColor = [1, 0, 0, 1];
          }
        } catch (e) {
          console.error("couldn't allocate a texture");
          clearColor = [1, 0, 0, 1];
        }
      } else {
        clearColor = [0, 0, 0, 1];
        // something went wrong, render an error texture...
      }
    }, 60 / 1000);

    return () => {
      clearInterval(renderLoopId);
    };
  }, [regl, shaders, currentChunk, viewer, tree, parentElement.current]);

  return (
    <div className="relative top-0 left-0 rounded bg-black">
      <canvas ref={baseCanvas} className="rounded" />
    </div>
  );
}
