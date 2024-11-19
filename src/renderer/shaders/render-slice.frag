precision highp float;

varying vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_normalization;

void main() {
  vec4 v = texture2D(u_texture, v_uv);
  // gl_FragColor = vec4(v_uv, 0., 1.);

  gl_FragColor = vec4(vec3(v.r) / u_normalization, 1);
}