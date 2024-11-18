import { Regl, Texture2D } from "regl";

export class TextureCache {
  regl: Regl;
  textures: { [size: `${number}-${number}`]: Texture2D };

  constructor(regl: Regl) {
    this.regl = regl;
    this.textures = {};
  }

  tex(data: Float32Array, shape: [number, number]): Texture2D | false {
    if (data.length !== shape[0] * shape[1]) return false;

    let key: `${number}-${number}` = `${shape[0]}-${shape[1]}`;

    if (typeof this.textures[key] !== "undefined") {
      // NOTE(Nic): update texture in place w/ new data.

      const tex = this.textures[key];
      tex.subimage(data, 0, 0);
      return tex;
    } else {
      // NOTE(Nic): allocate a new texture.
      const tex = this.regl.texture({
        format: "luminance",
        type: "float",
        data,
        width: shape[0],
        height: shape[1],
        flipY: true,
      });

      this.textures[key] = tex;
      return tex;
    }
  }
}
