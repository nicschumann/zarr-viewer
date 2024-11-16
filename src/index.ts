import create_regl, { Regl } from "regl";
import * as zarr from "zarrita";
import { get, slice } from "@zarrita/indexing";

/** SHADER IMPORTS! */
// @ts-ignore
import vert from "./shaders/place-slice.vert";

// @ts-ignore
import frag from "./shaders/render-slice.frag";
import { mat3 } from "gl-matrix";

const regl = create_regl({
  attributes: {
    preserveDrawingBuffer: true,
  },
  extensions: [
    "OES_texture_float",
    "OES_texture_float_linear",
    "EXT_shader_texture_lod",
  ],
});

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

let baseTime = 421192;

const getSlice = async (store: zarr.Array<zarr.Float32, zarr.FetchStore>) => {
  let chunk = await get(store, [
    baseTime,
    0,
    slice(12600, 12900),
    slice(5600, 5900),
  ]);

  const bounds = chunk.data.reduce(
    (prev, value) => ({
      min: Math.min(prev.min, value),
      max: Math.max(prev.max, value),
    }),
    { max: -Infinity, min: Infinity }
  );

  return { chunk, bounds };
};

let aspect = 1.0;
let shape = [1, 1];
let zoom = 1.0;
let matrix = getMatrix(aspect, zoom, shape);
let normalization_constant = 350;
// ui state
let keyIsDown = false;
let advanceDir = 1;

class DrawCalls {
  constructor(regl: Regl) {}
}

window.onload = async () => {
  const cloud_root =
    "http://localhost:3000/zarr/goes-fog-tomorrow-0.01-5min.zarr/X";
  const mask_root =
    "http://localhost:3000/zarr/goes-fog-tomorrow-clouds-0.01-5min.zarr/BCM";

  const store = new zarr.FetchStore(cloud_root);
  const arr = await zarr.open.v2(store, { kind: "array" }); // zarr.Array<DataType, FetchStore>

  // read chunk

  let { chunk, bounds } = await getSlice(arr);

  normalization_constant = bounds.max;

  shape = chunk.shape;
  aspect = shape[0] / shape[1];

  // texture
  const newData = new Float32Array(chunk.data.length * 4);
  const texture = regl.texture({
    data: newData.map((_, i) => chunk.data[Math.floor(i / 4)]),
    width: shape[0],
    height: shape[1],
    type: "float",
    mag: "nearest",
    min: "nearest",
    flipY: true,
  });

  const renderSlice = regl({
    frag,

    vert,

    attributes: {
      position: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      uv: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
    },

    uniforms: {
      u_texture: regl.prop("u_chunk"),
      u_matrix: regl.prop("u_matrix"),
      u_normalization: regl.prop("u_normalization"),
    },

    count: 4,
    primitive: "triangle strip",
  });

  regl.frame(async ({ time }) => {
    // clear contents of the drawing buffer
    regl.clear({
      // color: [0, 0, 0, 1],
      depth: 1,
    });

    if (keyIsDown) {
      baseTime += advanceDir;
      keyIsDown = false;

      let { chunk, bounds } = await getSlice(arr);

      normalization_constant = bounds.max;

      shape = chunk.shape;
      aspect = shape[0] / shape[1];

      // texture
      texture.subimage(
        {
          data: newData.map((_, i) => chunk.data[Math.floor(i / 4)]),
        },
        0,
        0
      );
    }

    // draw a triangle using the command defined above
    matrix = getMatrix(aspect, zoom, chunk.shape);
    renderSlice({
      u_chunk: texture,
      u_matrix: matrix,
      u_normalization: normalization_constant,
    });
  });
};

window.addEventListener("resize", () => {
  const canvasElements = document.getElementsByTagName("canvas");
  if (canvasElements.length === 1) {
    const canvas: HTMLCanvasElement = canvasElements[0];
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  }

  matrix = getMatrix(aspect, zoom, shape);
});

window.addEventListener("keydown", (e) => {
  if (e.key == "ArrowUp") {
    keyIsDown = true;
    advanceDir = 1;
  }

  if (e.key == "ArrowDown") {
    keyIsDown = true;
    advanceDir = -1;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key == "ArrowUp") {
    keyIsDown = false;
  }

  if (e.key == "ArrowDown") {
    keyIsDown = false;
  }
});
