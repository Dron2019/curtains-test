
import {Curtains, Plane, Vec2, Vec3, ShaderPass} from 'curtainsjs';
import {gsap, smoothScroll, ScrollTrigger} from './gsap/gsapWithProxy';
import {TextTexture} from './textCurtains/TextTexture.js';
import {textfsscrollFs, textfsvs, textfs} from './textCurtains/textShaders.js';
window.addEventListener("load", () => {
    // we will keep track of all our planes in an array
    const planes = [];
    let scrollEffect = 0;

    // get our planes elements
    const planeElements = document.getElementsByClassName("plane");

    
    const useNativeScroll = smoothScroll.isMobile;
    let planesDeformations = 0;
    // set up our WebGL context and append the canvas to our wrapper
    const curtains = new Curtains({
        container: "canvas",
        watchScroll: useNativeScroll, // watch scroll on mobile not on desktop since we're using locomotive scroll
        pixelRatio: Math.min(1.5, window.devicePixelRatio) // limit pixel ratio for performance
    });
    onSuccessAddText(curtains)
    curtains.onRender(() => {
        if(useNativeScroll) {
            // update our planes deformation
            // increase/decrease the effect
            scrollEffect = curtains.lerp(scrollEffect, 0, 0.05);
            planesDeformations / 60
            plane.uniforms.displacement.value = planesDeformations / 60;
            if(Math.abs(delta.y) > Math.abs(planesDeformations)) {
                planesDeformations = curtains.lerp(planesDeformations, delta.y, 0.5);
            }
        }
    }).onScroll(() => {
        // get scroll deltas to apply the effect on scroll
        const delta = curtains.getScrollDeltas();
        planesDeformations = curtains.lerp(planesDeformations, delta.y, 0.5);
        // invert value for the effect
        delta.y = -delta.y;

        // threshold
        if(delta.y > 60) {
            delta.y = 60;
        }
        else if(delta.y < -60) {
            delta.y = -60;
        }

        if(useNativeScroll && Math.abs(delta.y) > Math.abs(scrollEffect)) {
            scrollEffect = curtains.lerp(scrollEffect, delta.y, 0.1);
            window.scrollEffect= curtains.lerp(scrollEffect, delta.y, 0.1);
        }
        else {
            scrollEffect = curtains.lerp(scrollEffect, delta.y * 1, 0.1);
            window.scrollEffect = curtains.lerp(scrollEffect, delta.y * 1, 0.1);
            // console.log(scrollEffect);
        }

        // manually update planes positions
        for(let i = 0; i < planes.length; i++) {
            // apply additional translation, scale and rotation
            applyPlanesParallax(i);

            // update the plane deformation uniform as well
            planes[i].uniforms.scrollEffect.value = scrollEffect;
        }
    }).onError(() => {
        // we will add a class to the document body to display original images
        document.body.classList.add("no-curtains", "planes-loaded");
    }).onContextLost(() => {
        // on context lost, try to restore the context
        curtains.restoreContext();
    });
    
    function updateScroll(xOffset, yOffset) {
        // update our scroll manager values
        curtains.updateScrollValues(xOffset, yOffset);
    }
    
    // custom scroll event
    if(!useNativeScroll) {
        // we'll render only while lerping the scroll
        curtains.disableDrawing();
        smoothScroll.on('scroll', (obj) => {
            updateScroll(obj.scroll.x, obj.scroll.y);

            // render scene
            curtains.needRender();
        });
    }

    // keep track of the number of plane we're currently drawing
    const debugElement = document.getElementById("debug-value");
    // we need to fill the counter with all our planes
    let planeDrawn = planeElements.length;

    const vs = `
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

    const fs = `
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

    const params = {
        vertexShader: vs,
        fragmentShader: fs,
        widthSegments: 10,
        heightSegments: 10,
        uniforms: {
            displacement: {
                name: "uDisplacement",
                type: "1f",
                value: 0,
            },
            planeDeformation: {
                name: "uPlaneDeformation",
                type: "1f",
                value: 0,
            },
            alpha: {
                name: "alpha",
                value: 0,
                type: '1f'
            },
            
            scrollEffect: {
                name: "uScrollEffect",
                type: "1f",
                value: 0,
            },
        },
    };

    // add our planes and handle them
    for(let i = 0; i < planeElements.length; i++) {
        const plane = new Plane(curtains, planeElements[i], params);
        
        planes.push(plane);
        plane.textures[0].scale = new Vec3(1.2,1.2,1.2);
        handlePlanes(i);
    }
    planes.forEach((plane, index) => {
        
        
        plane.onError(() => {
            console.log("plane error", plane);
        }).onReady(() => {
            // once everything is ready, display everything
            if(index === planes.length - 1) {
                document.body.classList.add("planes-loaded");
            }
        }).onRender(() => {
            // update the uniform
            plane.uniforms.planeDeformation.value = planesDeformations;
        });
        ScrollTrigger.create({
            trigger: plane.htmlElement,
            markers: true,
            onEnter: () => {
                
            },
            onEnterBack: () => {
            },
            onUpdate: (self) => {
                gsap.to(plane.uniforms.alpha, { value: Math.min(0.5 + self.progress, 1) });
                gsap.to(plane.htmlElement.parentElement.querySelector('h2'), { scale: 1 + self.progress })
                // plane.uniforms.alpha.value = 0.8 + self.progress;
                // plane.textures[0].setOffset(new Vec2(0, self.progress * 0.1))
                gsap.to(plane.textures[0].offset, { y: self.progress * 0.15 })
                // gsap.utils.interpolate(plane.textures[0].offset.y ,self.progress,0.1)
                // plane.textures[0].setOffset(new Vec2(0, self.progress))
            }
        })
    })

    // handle all the planes
    function handlePlanes(index) {
        const plane = planes[index];

        // check if our plane is defined and use it
        plane.onReady(() => {
            // apply parallax on load
            applyPlanesParallax(index);

            // once everything is ready, display everything
            if(index === planes.length - 1) {
                document.body.classList.add("planes-loaded");
            }
        }).onAfterResize(() => {
            // apply new parallax values after resize
            applyPlanesParallax(index);
        }).onRender((e) => {
            // new way: we just have to change the rotation and scale properties directly!
            // apply the rotation
            // plane.rotation.z = Math.abs(scrollEffect) / 1500;

            // scale plane and its texture
            // plane.scale.y = 1 + Math.abs(scrollEffect) / 600;
            // plane.textures[0].scale.y = 1 + Math.abs(scrollEffect) / 300;

            // plane.relativeTranslation.y = 5
            // console.log(scrollEffect);

            /*
            // old way: using setRotation and setScale
            plane.setRotation(new Vec3(0, 0, scrollEffect / 750));
            plane.setScale(new Vec2(1, 1 + Math.abs(scrollEffect) / 300));
            plane.textures[0].setScale(new Vec2(1, 1 + Math.abs(scrollEffect) / 150));
            */
        }).onReEnterView(() => {
            // plane is drawn again
            planeDrawn++;
            // update our number of planes drawn debug value
            // debugElement.innerText = planeDrawn;
        }).onLeaveView(() => {
            // plane is not drawn anymore
            planeDrawn--;
            // update our number of planes drawn debug value
            // debugElement.innerText = planeDrawn;
        });
    }

    function applyPlanesParallax(index) {
        // calculate the parallax effect

        // get our window size
        const sceneBoundingRect = curtains.getBoundingRect();
        // get our plane center coordinate
        const planeBoundingRect = planes[index].getBoundingRect();
        const planeOffsetTop = planeBoundingRect.top + planeBoundingRect.height / 2;
        // get a float value based on window height (0 means the plane is centered)
        const parallaxEffect = (planeOffsetTop - sceneBoundingRect.height / 2) / sceneBoundingRect.height;

        // apply the parallax effect
        // planes[index].relativeTranslation.y = parallaxEffect * sceneBoundingRect.height / 4;

        /*
        // old way using setRelativeTranslation
        planes[index].setRelativeTranslation(new Vec3(0, parallaxEffect * (sceneBoundingRect.height / 4)));
         */
    }

    const shaderPassFs = `
        precision mediump float;
    
        varying vec3 vVertexPosition;
        varying vec2 vTextureCoord;
    
        uniform sampler2D uRenderTexture;
        uniform sampler2D displacementTexture;
    
        uniform float uDisplacement;
    
        void main( void ) {
            vec2 textureCoords = vTextureCoord;
            vec4 displacement = texture2D(displacementTexture, textureCoords);
    
            // displace along Y axis
            textureCoords.y += (sin(displacement.r) / 150.0) * uDisplacement;
            textureCoords.x += (sin(displacement.r) / 200.0) * uDisplacement;
            
            gl_FragColor = texture2D(uRenderTexture, textureCoords);
        }
    `;

    const shaderPassParams = {
        fragmentShader: shaderPassFs, // we'll be using the lib default vertex shader
        uniforms: {
            displacement: {
                name: "uDisplacement",
                type: "1f",
                value: 0,
            },
        },

        texturesOptions: {
            anisotropy: 10,
        }
    };
    const shaderPass = new ShaderPass(curtains, shaderPassParams);

    // we will need to load a new image
    const image = new Image();
    image.src = "./img/displacement.jpg";
    // set its data-sampler attribute to use in fragment shader
    image.setAttribute("data-sampler", "displacementTexture");

    // if our shader pass has been successfully created
    if(shaderPass) {
        // load our displacement image
        shaderPass.loader.loadImage(image);
        shaderPass.onLoading((texture) => {
            console.log("shader pass image has been loaded and texture has been created:", texture);
        }).onReady(() => {
            console.log("shader pass is ready");
        }).onRender(() => {
            // update the uniforms
            shaderPass.uniforms.displacement.value = planesDeformations / 60;
        }).onError(() => {
            console.log('shader pass error');
        });
    }
});





function onSuccessAddText(curtains) {
    const scroll = {
        value: 0,
        lastValue: 0,
        effect: 0,
    };
    curtains.onSuccess(() => {
        const fonts = {
            list: [
                'normal 400 1em "Arial", sans-serif',
                'normal 300 1em "Arial", sans-serif',
            ],
            loaded: 0
        };

        // load the fonts first
        fonts.list.forEach(font => {
            document.fonts.load(font).then(() => {
                fonts.loaded++;

                if(fonts.loaded === fonts.list.length) {

                    // create our shader pass
                    // const scrollPass = new ShaderPass(curtains, {
                    //     // fragmentShader: textfsscrollFs,
                    //     depth: false,
                    //     uniforms: {
                    //         scrollEffect: {
                    //             name: "uScrollEffect",
                    //             type: "1f",
                    //             value: scroll.effect,
                    //         },
                    //         scrollStrength: {
                    //             name: "uScrollStrength",
                    //             type: "1f",
                    //             value: 2.5,
                    //         },
                    //     }
                    // });

                    // calculate the lerped scroll effect
                    // scrollPass.onRender(() => {
                    //     scroll.lastValue = window.scrollEffect;
                    //     scroll.value = curtains.getScrollValues().y;

                    //     // clamp delta
                    //     scroll.delta = Math.max(-30, Math.min(30, scroll.lastValue - scroll.value));
                    //     console.log(scroll);
                    //     scroll.effect = curtains.lerp(window.scrollEffect, scroll.delta, 0.05);
                    //     scrollPass.uniforms.scrollEffect.value = scroll.effect;
                    // });

                    // create our text planes
                    const textEls = document.querySelectorAll('.text-plane');
                    textEls.forEach(textEl => {
                        const textPlane = new Plane(curtains, textEl, {
                            vertexShader: textfsvs,
                            fragmentShader: textfs
                        });

                        // create the text texture and... that's it!
                        const textTexture = new TextTexture({
                            plane: textPlane,
                            textElement: textPlane.htmlElement,
                            sampler: "uTexture",
                            resolution: 1.5,
                            skipFontLoading: true, // we've already loaded the fonts
                        });
                        const plane = new Plane(curtains, textPlane.htmlElement, {
                            fragmentShader: textfsscrollFs,
                            vertexShader: textfsvs,
                            depth: false,
                            uniforms: {
                                texture: {
                                    name: 'uRenderTexture',
                                    type: 'uTexture',
                                    value: textTexture
                                },
                                scrollEffect: {
                                    name: "uScrollEffect",
                                    type: "1f",
                                    value: scroll.effect,
                                },
                                scrollStrength: {
                                    name: "uScrollStrength",
                                    type: "1f",
                                    value: 2.5,
                                },
                            }
                        });
                        plane.onRender(() => {
                            scroll.lastValue = window.scrollEffect;
                            scroll.value = curtains.getScrollValues().y;
    
                            // clamp delta
                            scroll.delta = Math.max(-30, Math.min(30, scroll.lastValue - scroll.value));
                            scroll.effect = curtains.lerp(window.scrollEffect, scroll.delta, 0.05);
                            plane.uniforms.scrollEffect.value = scroll.effect;
                        });
                        console.log(textTexture);
                    });
                }
            })
        })
    });
}