import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import {WebGL2Renderer} from 'three/src/renderers/WebGL2Renderer';
THREE.WebGL2Renderer = WebGL2Renderer;
import Stats from 'stats.js';
import {EffectComposer} from './libs/EffectComposer';
import RenderPass from './libs/RenderPass';
import ShaderPass from './libs/ShaderPass';
import CopyShader from './libs/CopyShader';
import WebGLDeferredRenderer from './libs/WebGLDeferredRenderer';
THREE.WebGLDeferredRenderer = WebGLDeferredRenderer;
import CreateControls from 'orbit-controls';
import isEqual from 'lodash.isequal';
import {each, tryFn} from '@jaszhix/utils';
import defaults from './defaults';
import {controlsProps, rendererProps, sceneProps, cameraProps, nonParamProps} from './static';

const threeComponents = Object.keys(THREE);
const components = {};

// Based on https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
const getParamNames = function(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) {
    result = [];
  }
  return result;
}

each(threeComponents, (component)=>{
  if (typeof THREE[component] !== 'function') {
    return;
  }

  components[component] = class extends React.Component {
    static displayName = component;
    static defaultProps = {
      width: window.innerWidth,
      height: window.innerHeight,
      style: {},
      stats: null,
      deferred: false
    }

    constructor(props) {
      super(props);

      if (this.props.deferred) {
        component = 'WebGLDeferredRenderer';
      }
      this.name = component;
      this.moduleParams = getParamNames(THREE[component]);
      this.isRenderer = false;
      this.stats = null;
      this.init();
    }
    init = () => {
      let pureProps = {};
      let setProps = {};
      let instance;
      let instanceProps = [];
      let params = [];

      this.callbacks = [];

      each(this.props, (value, key)=>{
        if ((nonParamProps.indexOf(key) === -1
          && cameraProps.indexOf(key) === -1
          && controlsProps.indexOf(key) === -1)
          || (!this.isRenderer && defaults[component] && typeof defaults[component][key] !== 'undefined')) {
          if (key.slice(0, 3) === 'set') {
            setProps[key] = value;
          } else {
            pureProps[key] = value;
          }
        }
      });

      if (this.moduleParams.length === 0) {
        instance = new THREE[component]();
      } else {
        each(this.moduleParams, (param)=>{
          if (typeof pureProps[param] !== 'undefined') {
            params.push(pureProps[param]);
          } else if (defaults[component] && typeof defaults[component][param] !== 'undefined') {
            params.push(defaults[component][param]);
          }
        });
        if (params.length === 0) {
          instance = new THREE[component](pureProps);
        } else {
          instance = new THREE[component](...params);
        }

        this.isRenderer = instance.hasOwnProperty('domElement');

        each(pureProps, (value, key)=>{
          if ((!this.isRenderer && this.moduleParams.indexOf(key) === -1) || (this.isRenderer && rendererProps.indexOf(key) === -1)) {
            instanceProps.push(key);
          }
        });
        each(instanceProps, (prop)=>{
          tryFn(() => {
            if (Array.isArray(pureProps[prop])) {
              instance[prop].set(...pureProps[prop]);
            } else {
              throw new Error();
            }
          }, () => instance[prop] = pureProps[prop]);
        });
      }

      this.instance = instance;

      if (this.isRenderer) {
        this.anisotropy = this.props.anisotropy ? this.props.anisotropy : null//instance.getMaxAnisotropy();
        each(setProps, (value, key)=>{
          tryFn(() => instance[key](...value));
        });

        this.scene = new THREE.Scene();

        each(sceneProps, (propKey)=>{
          if (typeof this.props[propKey] !== 'undefined') {
            this.scene[propKey] = this.props[propKey]
          }
        });

        this.camera = this.props.camera || new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

        each(cameraProps, (propKey)=>{
          if (typeof this.props[propKey] !== 'undefined') {
            this.camera[propKey] = this.props[propKey]
          }
        });

        this.controls = this.props.controls ? this.props.controls : CreateControls({
          element: this.instance.domElement,
          distanceBounds: [1, 10000],
          distance: 2.5,
          phi: 70 * Math.PI / 180,
          zoomSpeed: 0.7
        });

        this.controls.needsUpdate = true;

        this.target = new THREE.Vector3();

        each(controlsProps, (propKey)=>{
          if (propKey === 'onResize') {
            window.addEventListener('resize', this.handleResize);
          }
          if (typeof this.props[propKey] === 'function') {
            let domElement = propKey === 'onMouseMove' ? window : this.instance.domElement;
            domElement.addEventListener(propKey.slice(2).toLowerCase(), this.props[propKey]);
          }
        });

        if (this.props.shaders || this.props.passes) {
          this.usesComposer = true;
          this.composer = new EffectComposer(this.instance);
          this.composer.addPass(new RenderPass(this.scene, this.camera));

          if (Array.isArray(this.props.shaders) && this.props.shaders.length > 0) {
            this.shaders = this.props.shaders;
            each(this.shaders, (shader)=>{
              let copyPass = new ShaderPass(shader);
              copyPass.renderToScreen = true;
              this.composer.addPass(copyPass);
            });
          }

          if (Array.isArray(this.props.passes) && this.props.passes.length > 0) {
            this.passes = this.props.passes;
            each(this.passes, (pass)=>{
              this.composer.addPass(pass);
            });
          }
        }

        this.handleSkyBox();

        if (this.props.stats !== null) {
          this.stats = new Stats();
          this.stats.showPanel(this.props.stats);
          document.body.appendChild(this.stats.dom);
        }
      } else if (this.props.parent) {
        this.renderer = this.props.renderer;
        this.scene = this.props.scene;
        this.camera = this.props.camera;
        this.controls = this.props.controls;
        this.addToParent('parent');
      }

      if (this.props.name) {
        this.instance.name = this.props.name;
      }

      if (typeof this.props.onMount === 'function') {
        this.props.onMount({
          instance: this.instance,
          renderer: this.isRenderer ? this.instance : this.renderer,
          scene: this.scene,
          camera: this.camera,
          controls: this.controls,
          target: this.target
        });
      }
    }
    componentDidMount() {
      let checkDOM = ()=>{
        if (!this.domElement) {
          setTimeout(() => checkDOM(), 500);
          return;
        }
        this.handleStyle(this.props);
        this.domElement.appendChild(this.instance.domElement);
        this.renderThree();
      };

      if (this.isRenderer) {
        checkDOM();
      }
      this.handleAnimateCallback();
    }
    componentDidUpdate(prevProps) {
      if (!this.isRenderer) return;

      if (prevProps.height !== this.props.height || prevProps.width !== this.props.width) {
        this.handleResize();
      }

      if (prevProps.skybox !== this.props.skybox) {
        this.handleSkyBox();
      }

      if (!isEqual(prevProps.style, this.props.style)) {
        this.handleStyle(this.props);
      }
    }
    componentWillUnmount() {
      this.unmountThree();
    }
    unmountThree = () => {
      if (!this.isRenderer) {
        this.scene.remove(this.instance);
        if (this.instance.dispose) {
          this.instance.dispose();
        }
        return;
      }

      window.cancelAnimationFrame(this.renderId);

      if (this.instance.dispose) {
        this.instance.dispose();
      }
      each(controlsProps, (propKey)=>{
        if (typeof this.props[propKey] === 'function') {
          window.removeEventListener(propKey.slice(2).toLowerCase(), this.props[propKey]);
          if (propKey === 'onResize') {
            window.removeEventListener('resize', this.handleResize);
          }
        }
      });
    }
    renderThree = (time) => {
      this.renderId = window.requestAnimationFrame(this.renderThree);

      if (this.stats != null) {
        this.stats.begin();
      }

      this.updateControls();

      if (this.callbacks && this.callbacks.length > 0) {
        each(this.callbacks, (cbObject)=>{
          if (Array.isArray(cbObject.param)) {
            cbObject.cb(...cbObject.params);
          } else {
            cbObject.cb(cbObject.params, time);
          }
        });
      }

      if (this.usesComposer) {
        this.composer.render()
      } else {
        this.instance.render(this.scene, this.camera);
      }

      if (this.stats != null) {
        this.stats.end();
      }
    }
    handleSkyBox = () => {
      const {skybox} = this.props;

      if (this.scene.background) this.scene.background.dispose();

      if (skybox && Array.isArray(skybox)) {
        let textureCube = new THREE.CubeTextureLoader().load(this.props.skybox);
        textureCube.anisotropy = this.anisotropy;
        this.scene.background = textureCube;
      } else {
        if (this.scene.background) this.scene.background.dispose();

        this.scene.background = null;
      }
    }
    handleStyle = (props) => {
      let style = Object.assign({width: props.width, height: props.height}, props.style);
      each(style, (value, key)=>{
        this.instance.domElement.style[key] = value;
      });
    }
    handleResize = () => {
      this.instance.setSize(this.props.width, this.props.height);
      this.handleStyle(this.props);

      if (this.usesComposer) {
        this.composer.setSize(this.props.width, this.props.height);
      }
      this.updateControls();
    }
    updateControls = () => {
      if (typeof this.props.updateControls === 'function') {
        this.props.updateControls(this);
        return;
      }

      if (!this.controls.needsUpdate) {
        return;
      }
      let width = this.props.width;
      let height = this.props.height;
      let aspect = width / height;

      // update camera controls
      this.controls.update()
      this.camera.position.fromArray(this.controls.position)
      this.camera.up.fromArray(this.controls.up)
      this.target.fromArray(this.controls.direction).add(this.camera.position)
      this.camera.lookAt(this.target)

      // Update camera matrices
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.camera.updateMatrixWorld();
    }
    setTarget = (vector3) => {
      this.target.copy(vector3);
    }
    addCallback = (cb) => {
      this.callbacks.push(cb)
    }
    handleAnimateCallback = () => {
      if (typeof this.props.onAnimate === 'function') {
        this.onAnimateCallback = this.props.onAnimate
        let addCallback = this.isRenderer ? this.addCallback : this.props.addCallback;
        addCallback({params: this, cb: this.onAnimateCallback});
      }
    }
    addToParent = () => {
      let key = this.props.parent.hasOwnProperty('domElement') ? 'scene' : 'parent';
      this.props[key].add(this.instance);
    }
    injectProps = (child) => {
      if (!child) return null;

      let el = React.cloneElement(child, {
        parent: this.instance,
        addCallback: this.isRenderer ? this.addCallback : this.props.addCallback ? this.props.addCallback : null,
        renderer: this.isRenderer ? this.instance : this.props.renderer ? this.props.renderer : null,
        scene: this.isRenderer ? this.scene : this.props.scene ? this.props.scene : null,
        camera: this.isRenderer ? this.camera : this.props.camera ? this.props.camera : null,
        controls: this.isRenderer ? this.controls : this.props.controls ? this.props.controls : null,
        anisotropy: this.isRenderer ? this.anisotropy : this.props.anisotropy ? this.props.anisotropy : null,
      });

      return el;
    }
    handleChildren = () => {
      let children = this.props.children;
      let _children = [];
      let arrayChildren = [];

      each(children, (child, i)=>{
        if (Array.isArray(child)) {
          arrayChildren.push({children: child, key: i});
        }
      });

      each(arrayChildren, (child)=>{
        children = children.concat(child.children);
        children.splice(child.key, 1);
      });

      if (!children) return null;

      if (!Array.isArray(children)) {
        children = [children];
      }

      each(children, (child, k)=>{
        _children.push(
          <threact-node key={k}>
            {this.injectProps(child)}
          </threact-node>
        )
      })

      return _children;
    }
    getRef = (ref) => {
      this.domElement = ref;
    }
    render() {
      let children = this.handleChildren();

      return (
        <threact-node ref={this.getRef}>
          {children}
        </threact-node>
      );
    }
  }
});

export default components;

