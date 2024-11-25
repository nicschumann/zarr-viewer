import {
  IndexType,
  useApplicationState,
  ZarrArray,
  ZarrTree,
  ZarrView,
} from "@/state";
import React, { useRef, useEffect, useState } from "react";
import create_regl, { Regl, Texture2D, Vec4 } from "regl";

import * as zarr from "zarrita";
import { get, slice } from "@zarrita/indexing";
import { CompiledShaders, compileShaders } from "@/renderer/compile";
import { mat3 } from "gl-matrix";
import { TextureCache } from "@/renderer/texture-cache";

function makeKey(
  store: zarr.Array<zarr.Float32, any>,
  slice: IndexType[]
): string {
  return `${store.path}-${slice.join("/")}`;
}

const getRegion = async (
  store: zarr.Array<zarr.Float32, any>,
  index: IndexType[]
) => {
  const zarrIndex = index.map((value) => {
    if (typeof value === "number") return value;
    else if (value === null) {
      return slice(null);
    } else return slice(value[0], value[1]);
  });

  console.log(zarrIndex);

  let chunk = await get(store, zarrIndex);

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
  const x = viewer.selection[viewer.mapping[0]];
  const y = viewer.selection[viewer.mapping[1]];

  const shape = [x, y]
    .filter((v) => v && typeof v === "object")
    .map((v) => v[1] - v[0]);

  if (shape.length == 0) {
    return false;
  }

  if (shape.length == 1) {
    return [shape[0], 1];
  }

  if (shape.length == 2) {
    return [shape[0], shape[1]];
  }

  return false;
};

function getViewportScaledArraySize(aspect: number, zoom: number) {
  const length =
    (Math.min(window.innerWidth, window.innerHeight) - 100) *
    window.devicePixelRatio;
  if (aspect >= 1.0) {
    return [length * zoom, (1 / aspect) * length * zoom];
  } else {
    return [aspect * length * zoom, length * zoom];
  }
}

const getMatrix = (aspect: number, zoom: number, shape: number[]) => {
  let viewport = [window.innerWidth, window.innerHeight];

  const size_px = getViewportScaledArraySize(aspect, zoom);

  let scalefactors = [
    (2.0 * size_px[0]) / (viewport[0] * window.devicePixelRatio),
    (-2.0 * size_px[1]) / (viewport[1] * window.devicePixelRatio),
  ];

  const translation = mat3.fromTranslation([], [-0.5, -0.5]);
  const scaling = mat3.fromScaling([], scalefactors);

  return mat3.multiply([], scaling, translation);
};

type DataCache = {
  key: string;
  array: zarr.Chunk<"float32"> | null;
  bounds: { min: number; max: number };
};

export default function ArrayRenderer({ viewer }: { viewer: ZarrView }) {
  // global state
  const store = useApplicationState((state) => state.store);

  // local rendering data
  const [currentChunk, setCurrentChunk] = useState<DataCache | null>(null);
  const [textures, setTextures] = useState<TextureCache | null>(null);
  const [shaders, setShaders] = useState<CompiledShaders | null>(null);
  const [regl, setRegl] = useState<Regl | null>(null);

  // html ref
  const baseCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!baseCanvas.current) return;

    baseCanvas.current.width = window.innerWidth;
    baseCanvas.current.height = window.innerHeight;

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

    const array = store.keys[viewer.path];

    setRegl((_) => localRegl);
    setShaders((_) => compileShaders(localRegl));
    setTextures(new TextureCache(localRegl));
  }, []);

  useEffect(() => {
    console.log(viewer);
    const array = store.keys[viewer.path];
    if (regl === null || shaders === null || typeof array === "undefined")
      return;

    const key = makeKey(array.ref, viewer.selection);

    if (
      typeof array !== "undefined" &&
      (currentChunk == null || currentChunk.key !== key)
    ) {
      console.log("get region");
      console.log(array.ref, viewer.selection);
      getRegion(array.ref, viewer.selection).then((data) => {
        const key = makeKey(array.ref, viewer.selection);
        setCurrentChunk((_) => ({
          key,
          array: data.chunk,
          bounds: data.bounds,
        }));
      });
    }

    let clearColor: Vec4 = [0, 0, 0, 0];

    const renderLoopId = setInterval(() => {
      regl.clear({ depth: 1, color: clearColor });

      const renderShape = getRenderShape(viewer);
      // NOTE(Nic): the selected chunk should have the same shape as this...

      if (renderShape && renderShape.length == 2 && currentChunk !== null) {
        const tex = textures.tex(currentChunk.array.data, renderShape);
        const aspect = renderShape[0] / renderShape[1];
        const zoom = 1;
        const matrix = getMatrix(aspect, zoom, renderShape);
        const normalization = currentChunk.bounds.max;

        // console.log(tex);
        // console.log(renderShape);

        shaders.renderSlice({
          u_chunk: tex,
          u_matrix: matrix,
          u_normalization: normalization,
          u_resolution: renderShape,
        });
      } else {
        clearColor = [0, 0, 0, 0];
        // something went wrong, render an error texture...
      }
    }, 60 / 1000);

    return () => {
      clearInterval(renderLoopId);
    };
  }, [regl, shaders, currentChunk, viewer, store.keys[viewer.path]]);

  const array: ZarrArray = store.keys[viewer.path];

  return (
    <div className="relative top-0 left-0">
      <canvas ref={baseCanvas} className="h-screen w-screen" />
      {/* <div className="absolute bottom-2 flex">
        {array && (
          <div className="mx-auto flex">
            {viewer.selection.map((selector, i) => {
              return (
                <div key={`selection-${i}`}>
                  {typeof selector === "number" && (
                    <span>
                      {array.ref.attrs["_ARRAY_DIMENSIONS"][i]}: {selector}
                    </span>
                  )}
                  {selector === null && <span>{selector}</span>}
                  {typeof selector === "object" && (
                    <span>
                      {array.ref.attrs["_ARRAY_DIMENSIONS"][i]}: {selector[0]}:{" "}
                      {selector[1]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div> */}
    </div>
  );
}
