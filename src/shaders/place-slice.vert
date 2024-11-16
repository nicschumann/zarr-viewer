precision highp float;

attribute vec2 position;
attribute vec2 uv;

varying vec2 v_uv;

uniform mat3 u_matrix;

void main() {
  v_uv = uv;

  vec3 pos = u_matrix * vec3(position, 1.0);
  gl_Position = vec4(pos.xy, 0., 1);
}