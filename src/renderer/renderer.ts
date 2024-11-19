import { Regl } from "regl";
import * as zarr from "zarrita";

import { CompiledShaders } from "./compile";
import { IndexType } from "@/state";

export type RenderState = {
  ref: zarr.Array<zarr.DataType, any>;
  slice: IndexType[];
};

export class Renderer {
  private regl: Regl;
  private shaders: CompiledShaders;

  constructor(regl: Regl, shaders: CompiledShaders) {
    this.regl = regl;
    this.shaders = shaders;
  }

  render(state: RenderState) {}
}
