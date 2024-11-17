import React from "react";
import ReactDOM from "react-dom";

function App() {
  return <h1>Hello, World</h1>;
}

ReactDOM.render(<App />, document.getElementById("root"));

// import create_regl from "regl";

// window.onload = () => {
//   const regl = create_regl({
//     attributes: {
//       preserveDrawingBuffer: true,
//     },
//     extensions: [
//       "OES_texture_float",
//       "OES_texture_float_linear",
//       "EXT_shader_texture_lod",
//     ],
//   });

//   const arrayData = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
//   const shape = [2, 4];

//   const newData = new Float32Array(arrayData.length * 4);
//   const texture = regl.texture({
//     data: newData.map((_, i) => arrayData[Math.floor(i / 4)]),
//     width: shape[0],
//     height: shape[1],
//     type: "float",
//     mag: "nearest",
//     min: "nearest",
//     flipY: true,
//   });

//   // Calling regl() creates a new partially evaluated draw command
//   const drawTriangle = regl({
//     // Shaders in regl are just strings.  You can use glslify or whatever you want
//     // to define them.  No need to manually create shader objects.
//     frag: `
//         precision mediump float;
//       //   uniform vec4 color;
//         uniform sampler2D u_texture;
//         varying vec2 v_uv;
//         void main() {
//           vec4 v = texture2D(u_texture, v_uv);
//           gl_FragColor = vec4(v.r/8., v.g/8., v.b/8., 1);
//         }`,

//     vert: `
//         precision mediump float;
//         attribute vec2 position;
//         attribute vec2 uv;
//         varying vec2 v_uv;
//         void main() {
//           v_uv = uv;
//           gl_Position = vec4(position, 0, 1);
//         }`,

//     // Here we define the vertex attributes for the above shader
//     attributes: {
//       // regl.buffer creates a new array buffer object
//       position: [
//         [-1, -1],
//         [1, -1],
//         [-1, 1],
//         [1, 1],
//       ],
//       uv: [
//         [0, 0],
//         [1, 0],
//         [0, 1],
//         [1, 1],
//       ],
//       // regl automatically infers sane defaults for the vertex attribute pointers
//     },

//     uniforms: {
//       // This defines the color of the triangle to be a dynamic variable
//       color: regl.prop("color"),
//       u_texture: texture,
//     },

//     // This tells regl the number of vertices to draw in this command
//     count: 4,
//     primitive: "triangle strip",
//   });

//   // regl.frame() wraps requestAnimationFrame and also handles viewport changes
//   regl.frame(({ time }) => {
//     // clear contents of the drawing buffer
//     regl.clear({
//       color: [0, 0, 0, 0],
//       depth: 1,
//     });

//     // draw a triangle using the command defined above
//     drawTriangle({
//       color: [
//         Math.cos(time * 0.01),
//         Math.sin(time * 0.008),
//         Math.cos(time * 0.03),
//         0.1,
//       ],
//     });
//   });
// };
