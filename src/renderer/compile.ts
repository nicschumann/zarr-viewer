import { DrawCommand, Regl } from "regl";

// @ts-ignore
import vert from "@/renderer/shaders/place-slice.vert";
// @ts-ignore
import frag from "@/renderer/shaders/render-slice.frag";

export type CompiledShaders = {
  renderSlice: DrawCommand;
};

export function compileShaders(regl: Regl): CompiledShaders {
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
      u_resolution: regl.prop("u_resolution"),
    },

    count: 4,
    primitive: "triangle strip",
  });

  return { renderSlice };
}
