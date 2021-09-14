export const textfsscrollFs = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;

// lerped scroll deltas
// negative when scrolling down, positive when scrolling up
uniform float uScrollEffect;

// default to 2.5
uniform float uScrollStrength;


void main() {
    vec2 scrollTextCoords = vTextureCoord;
    float horizontalStretch;

    // branching on an uniform is ok
    if(uScrollEffect >= 0.0) {
        scrollTextCoords.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(scrollTextCoords.y);
    }
    else if(uScrollEffect < 0.0) {
        scrollTextCoords.y += (scrollTextCoords.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(-1.0 * (1.0 - scrollTextCoords.y));
    }

    scrollTextCoords.x = scrollTextCoords.x * 2.0 - 1.0;
    scrollTextCoords.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
    scrollTextCoords.x = (scrollTextCoords.x + 1.0) * 0.5;

    gl_FragColor = texture2D(uRenderTexture, scrollTextCoords);
}
`;

export const textVertexShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// default mandatory variables
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

// custom variables
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

void main() {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

    // varyings
    vVertexPosition = aVertexPosition;
    vTextureCoord = aTextureCoord;
}
`;

export const textFragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
// lerped scroll deltas
// negative when scrolling down, positive when scrolling up
uniform float uScrollEffect;

// default to 2.5
uniform float uScrollStrength;
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uTexture;

void main( void ) {
    vec2 scrollTextCoords = vTextureCoord;
    float horizontalStretch;

    // branching on an uniform is ok
    if(uScrollEffect >= 0.0) {
        scrollTextCoords.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(scrollTextCoords.y);
    }
    else if(uScrollEffect < 0.0) {
        scrollTextCoords.y += (scrollTextCoords.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
        horizontalStretch = sin(-1.0 * (1.0 - scrollTextCoords.y));
    }

    scrollTextCoords.x = scrollTextCoords.x * 2.0 - 1.0;
    scrollTextCoords.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
    scrollTextCoords.x = (scrollTextCoords.x + 1.0) * 0.5;
    // scrollTextCoords.r = abs(1.0 * sin(uTime));
 
    gl_FragColor = texture2D(uTexture, scrollTextCoords);
}
`;

export const imageVertexShader = `
precision mediump float;

        // default mandatory variables
        attribute vec3 aVertexPosition;
        attribute vec2 aTextureCoord;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;

        uniform mat4 planeTextureMatrix;

        // custom variables
        varying vec3 vVertexPosition;
        varying vec2 vTextureCoord;
        uniform float alpha;
        uniform float uScrollEffect;
        uniform float uPlaneDeformation;

        void main() {
            vec3 vertexPosition = aVertexPosition;

            // cool effect on scroll
            //vertexPosition.x += sin((vertexPosition.y / 1.5 + 1.0) * 3.141592) * (sin(uPlaneDeformation / 2000.0));

            gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);
            gl_Position.y += alpha * 0.01;
            // varyings
            vVertexPosition = vertexPosition;
            vTextureCoord = (planeTextureMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
        }
`;
export const imageFragmentShader = `
precision mediump float;

        varying vec3 vVertexPosition;
        varying vec2 vTextureCoord;
        uniform float alpha;
        uniform float uDisplacement;
        uniform float uScrollEffect;
        uniform sampler2D planeTexture;
         
        void main( void ) {
            vec2 textCoords = vTextureCoord;
            // just display our texture
            // vTextureCoord.x = alpha;
            vec4 red = texture2D(planeTexture, textCoords + abs(sin(uScrollEffect/5000.0)));
            vec4 green = texture2D(planeTexture, vTextureCoord);
            vec4 blue = texture2D(planeTexture, textCoords + abs(sin(uScrollEffect/5000.0)));
            // gl_FragColor = texture2D(planeTexture, vTextureCoord);
            gl_FragColor = vec4(red.r, green.g, blue.b, green.a);
        }
`;