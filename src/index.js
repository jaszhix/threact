import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import autoBind from 'react-autobind';
import {WebGL2Renderer} from 'three/src/renderers/WebGL2Renderer';
THREE.WebGL2Renderer = WebGL2Renderer;
import Stats from 'stats.js';
import WebGLDeferredRenderer from './libs/WebGLDeferredRenderer';
THREE.WebGLDeferredRenderer = WebGLDeferredRenderer;
import {EffectComposer} from './libs/EffectComposer';
import RenderPass from './libs/RenderPass';
import ShaderPass from './libs/ShaderPass';
import CopyShader from './libs/CopyShader';
import CreateControls from 'orbit-controls';
import _ from 'lodash';
import each from './each';
import defaults from './defaults';

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
  components[component] = class extends React.PureComponent {
    static displayName = component;
    static defaultProps = {
      width: window.innerWidth,
      height: window.innerHeight,
      style: {},
      stats: null
    }
    constructor(props) {
      super(props);
      autoBind(this);

      this.name = component;
      this.moduleParams = getParamNames(THREE[component]);
      this.isRenderer = false;
      this.stats = null;
      this.controlsProps = ['onMouseMove', 'onMouseDown', 'onResize', 'onKeyUp', 'onKeyPress', 'onKeyDown'];

      this.init();
    }
    init(){
      let pureProps = {};
      let setProps = {};
      let rendererProps = ['canvas', 'context', 'precision', 'alpha', 'premultipliedAlpha', 'antialias', 'stencil', 'preserveDrawingBuffer', 'depth', 'logarithmicDepthBuffer'];
      let sceneProps = ['fog', 'overrideMaterial', 'autoUpdate'];
      let cameraProps = ['layers', 'matrixWorldInverse', 'projectionMatrix'];
      let nonParamProps = ['stats', 'shaders', 'passes', 'parent', 'renderer', 'scene', 'camera', 'controls', 'skybox', 'anisotropy', 'onAnimate', 'onMount', 'name', 'children', 'addCallback', 'width', 'height', 'style'];

      each(this.props, (value, key)=>{
        if ((nonParamProps.indexOf(key) === -1 && cameraProps.indexOf(key) === -1 && this.controlsProps.indexOf(key) === -1) || (!this.isRenderer && defaults[component] && typeof defaults[component][key] !== 'undefined')) {
          if (key.slice(0, 3) === 'set') {
            setProps[key] = value;
          } else {
            pureProps[key] = value;
          }
        }
      });

      let instance;
      if (this.moduleParams.length === 0) {
        instance = new THREE[component]();
      } else {
        let params = [];
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
        let instanceProps = [];
        each(pureProps, (value, key)=>{
          if ((!this.isRenderer && this.moduleParams.indexOf(key) === -1) || (this.isRenderer && rendererProps.indexOf(key) === -1)) {
            instanceProps.push(key);
          }
        });
        each(instanceProps, (prop)=>{
          try {
            if (Array.isArray(pureProps[prop])) {
              instance[prop].set(...pureProps[prop]);
            } else {
              throw new Error();
            }
          } catch (e) {
            instance[prop] = pureProps[prop];
          }
        });
      }
      this.instance = instance;

      if (this.isRenderer) {
        this.anisotropy = this.props.anisotropy ? this.props.anisotropy : null//instance.getMaxAnisotropy();
        each(setProps, (value, key)=>{
          try {
            instance[key](...value);
          } catch (e) {}
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
          canvas: this.instance.domElement,
          distanceBounds: [1, 10000],
          distance: 2.5,
          phi: 70 * Math.PI / 180,
          zoomSpeed: 0.7
        });
        this.target = new THREE.Vector3();
        each(this.controlsProps, (propKey)=>{
          if (propKey === 'onResize') {
            window.addEventListener('resize', this.handleResize);
          }
          if (typeof this.props[propKey] === 'function') {
            window.addEventListener(propKey.slice(2).toLowerCase(), this.props[propKey]);
          }
        });
        this.callbacks = [];
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
        if (this.props.skybox && Array.isArray(this.props.skybox)) {
          var textureCube = new THREE.CubeTextureLoader().load(this.props.skybox);
          textureCube.anisotropy = this.anisotropy;
          this.scene.background = textureCube;
        }
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
    }
    componentWillMount() {
      this.handleMountCallback()
    }
    componentDidMount() {
      if (process.env.NODE_ENV === 'development') {
        // react-hot-loader fix borrowed from react-three
        if (this._reactInternalInstance._renderedComponent._currentElement !== null) {
          this._reactInternalInstance._renderedComponent._renderedChildren = this._renderedChildren;
        }
      }
      if (this.isRenderer) {
        this.domElement = ReactDOM.findDOMNode(this);
        this.domElement.style = Object.assign({width: this.props.width, height: this.props.height}, this.props.style)
        this.domElement.appendChild(this.instance.domElement);
        this.renderThree();
      }
      this.handleAnimateCallback();
    }
    componentDidUpdate(prevProps, prevState) {
      if (process.env.NODE_ENV === 'development') {
        // react-hot-loader fix borrowed from react-three
        if (this._reactInternalInstance._renderedComponent._currentElement !== null) {
          this._reactInternalInstance._renderedComponent._renderedChildren = this._renderedChildren;
        }
        if (module.hot) {
          this.unmountThree();
        }
      }
    }
    componentWillUnmount(){
      this.unmountThree();
    }
    unmountThree(){
      if (process.env.NODE_ENV === 'development') {
        // react-hot-loader fix borrowed from react-three
        if (this._reactInternalInstance._renderedComponent._currentElement !== null) {
          this._reactInternalInstance._renderedComponent._renderedChildren = this._renderedChildren;
        }
      }
      if (!this.isRenderer) {
        this.scene.remove(this.instance);
        if (typeof this.instance.dispose === 'function') {
          this.instance.dispose();
        }
        return;
      }
      each(this.controlsProps, (propKey)=>{
        if (typeof this.props[propKey] === 'function') {
          window.removeEventListener(propKey.slice(2).toLowerCase(), this.props[propKey]);
          if (propKey === 'onResize') {
            window.removeEventListener('resize', this.handleResize);
          }
        }
      });
    }
    renderThree(time){
      window.requestAnimationFrame(this.renderThree);
      if (this.stats !== null) {
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
      if (this.stats !== null) {
        this.stats.end();
      }
    }
    handleResize(){
      this.instance.setSize(window.innerWidth, window.innerHeight);
      this.instance.domElement.style.width = window.innerWidth;
      this.instance.domElement.style.height = window.innerHeight;
      if (this.usesComposer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
      this.updateControls();
    }
    updateControls(){
      let width = window.innerWidth;
      let height = window.innerHeight;
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
    setTarget(vector3){
      this.target.copy(vector3);
    }
    addCallback(cb){
      this.callbacks.push(cb)
    }
    handleMountCallback(){
      if (typeof this.props.onMount === 'function') {
        this.props.onMount({
          instance: this.instance,
          renderer: this.renderer,
          scene: this.scene,
          camera: this.camera,
          controls: this.controls,
          target: this.target
        });
      }
    }
    handleAnimateCallback(){
      if (typeof this.props.onAnimate === 'function') {
        this.onAnimateCallback = this.props.onAnimate
        let addCallback = this.isRenderer ? this.addCallback : this.props.addCallback;
        addCallback({params: this, cb: this.onAnimateCallback});
      }
    }
    addToParent(){
      let key = this.props.parent.hasOwnProperty('domElement') ? 'scene' : 'parent';
      this.props[key].add(this.instance);
    }
    injectProps(child){
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
    handleChildren(){
      let children = this.props.children;
      let arrayChildren = [];
      each(children, (child, i)=>{
        if (Array.isArray(child)) {
          arrayChildren.push({children: child, key: i});
        }
      });
      each(arrayChildren, (child)=>{
        children = _.concat(children, child.children);
        _.pullAt(children, child.key);
      });
      if (!children) {
        return null;
      }
      if (!Array.isArray(children)) {
        children = [children];
      }
      let _children = [];
      each(children, (child, k)=>{
        _children.push(
          <threact key={k}>
            {this.injectProps(child)}
          </threact>
        )
      })
      return _children;
    }
    render(){
      let children = this.handleChildren();
      return (
        <threact ref={this.name}>
          {children}
        </threact>
      );
    }
  }
});

export default components;
