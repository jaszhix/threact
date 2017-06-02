<p align="center">
  <a href="https://npmjs.org/package/threact">
    <img src="https://img.shields.io/npm/v/threact.svg?style=flat-square"
         alt="NPM Version">
  </a>
  <a href="https://travis-ci.org/jaszhix/threact">
    <img src="https://img.shields.io/travis/jaszhix/threact.svg?style=flat-square"
         alt="Build Status">
  </a>
  <a href="https://npmjs.org/package/threact">
    <img src="http://img.shields.io/npm/dm/threact.svg?style=flat-square"
         alt="Downloads">
  </a>

  <a href="https://david-dm.org/jaszhix/threact.svg">
    <img src="https://david-dm.org/jaszhix/threact.svg?style=flat-square"
         alt="Dependency Status">
  </a>

  <a href="https://github.com/jaszhix/threact/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/threact.svg?style=flat-square"
         alt="License">
  </a>
</p>

### Simplified Three.JS wrapper for React

The goal of this project is to allow usage of Three.JS in React without modifying Three's API in the conversion process, and to do so without monkey patching React.

### Install Using NPM

```sh
npm install --save threact
```

### Example Usage

```js
import * as THREE from 'three';
import {WebGLRenderer, PointLight, HemisphereLight, Mesh} from 'threact';

class Root extends ReacComponent {
...
  render(){
    return (
      <WebGLRenderer 
      physicallyCorrectLights={true}
      gammaInput={true}
      gammaOutput={true}
      shadowMap={{enabled: true}}
      toneMapping={THREE.ReinhardToneMapping}
      antialias={true} 
      bgColor={0x00a1ff}
      setPixelRatio={window.devicePixelRatio}
      setSize={[window.innerWidth, window.innerHeight]}
      camera={new THREE.PerspectiveCamera(75, 1, 0.1, 1000)}
      scene={new THREE.Scene()}>
        <PointLight
        position={[0, 2, 0]}
        color={0xffee88}
        intensity={1}
        distance={100}
        decay={2}>
          <Mesh
          geometry={new THREE.SphereGeometry( 0.02, 16, 8 )}
          material={new THREE.MeshStandardMaterial({
            emissive: 0xffffee,
            emissiveIntensity: 1,
            color: 0x000000
          })}
          position={[0, 0, 0]}
          rotation={[- Math.PI / 2, 0, 0]}/>
        </PointLight>
        <HemisphereLight 
        skyColor={0xddeeff}
        groundColor={0x0f0e0d}
        intensity={0.02} />
        <Mesh 
        geometry={new THREE.PlaneBufferGeometry( 20, 20 )} 
        material={new THREE.MeshStandardMaterial( {
          roughness: 0.8,
          color: 0xffffff,
          metalness: 0.2,
          bumpScale: 0.0005
        })}
        rotation={[-Math.PI / 2.0, 0, 0]} />
        <Mesh 
        geometry={new THREE.SphereGeometry( 0.5, 32, 32 )}
        material={new THREE.MeshStandardMaterial( {
          color: 0xffffff,
          roughness: 0.5,
          metalness: 1.0
        })}
        position={[1, 0.5, 1]}
        rotation={[0, Math.PI, 0]}
        castShadow={true} />
      </WebGLRenderer>
    );
  }
}
```

### Props

  Threact will turn each method's parameters into props, so there's no confusion as to how props are mapped. The WEBGLRenderer and Mesh components will also map their instance's writable properties as props. Some of the custom props for handling the Three instances in React are below.

  #### WEBGLRenderer

  * ```width```: Integer. Sets the canvas and renderer width.
  * ```height```: Integer. Sets the canvas and renderer height.
  * ```controls```: Function. Override the default controls scheme. By default, this uses the ```orbit-controls``` package.
  * ```camera```: Function. Override the default camera scheme. By default, this uses the ```PerspectiveCamera```.
  * ```skybox```: Array. Sets the scene background using ```CubeTextureLoader```. Expects an array of six image paths.
  * ```passes```: Array. Loads extra shaders for post processing. This uses the ```EffectComposer``` extension.
  * ```anisotropy```: Integer (1-16) Overrides the default anisotropy setting, which is the renderer's max.
  * ```onMouseMove```: Function.
  * ```onMouseDown```: Function.
  * ```onResize```: Function.
  * ```onKeyUp```: Function.
  * ```onKeyPress```: Function.
  * ```onKeyDown```: Function.

  #### Generic

  * ```onMount```: Function. Called after the first render.
  * ```onAnimate```: Function. Called on each Three render.

### Todo

  * Write more tests.
  * Add a demo.