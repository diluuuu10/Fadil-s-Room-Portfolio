precision highp float;

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform float uMix;
varying vec2 vUv;

#include <common>
#include <colorspace_pars_fragment>

void main() {
  vec4 dayCol = texture2D(uDay, vUv);
  vec4 nightCol = texture2D(uNight, vUv);

  // ✅ No sRGBToLinear here (prevents double-darkening)
  vec4 col = mix(dayCol, nightCol, uMix);

  // ✅ Convert to output space correctly
  gl_FragColor = linearToOutputTexel(col);
}
