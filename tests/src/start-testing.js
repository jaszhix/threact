import 'source-map-support/browser-source-map-support';
import _ from 'lodash';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dirtyChai from 'dirty-chai';
import * as THREE from 'three';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import ReactTestRenderer from 'react-test-renderer';
import t from '../../dist/index';

const { expect } = chai;
const threeModules = Object.keys(THREE);
if (process.env.KARMA_TDD) {
  sourceMapSupport.install({
    handleUncaughtExceptions: true,
    environment: 'node',
    hookRequire: true,
  });
}

chai.use(dirtyChai);
chai.use(chaiAsPromised);

class Container extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
    return (
      <t.WebGLRenderer
      deferred={this.props.deferred}
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
      scene={new THREE.Scene()} />
    );
  }
}

module.exports = (type) => {
  const div = document.createElement('div');
  describe(`${type}`, () => {
    describe('Threact', () => {
      it('Imports componetized versions of all methods', () => {
        let modules = threeModules.filter((module)=>{
          return typeof THREE[module] === 'function';
        });
        let successes = 0;
        modules.forEach((module)=>{
          try {
            if (t[module]) {
              ++successes;
            }
          } catch (e) {}
        });

        expect(successes).to.equal(Object.keys(t).length);
      });
      it('Threact object has alternate renderer extensions available', () => {
        expect(typeof t.WebGL2Renderer).to.not.equal('undefined');
        expect(typeof t.WebGLDeferredRenderer).to.not.equal('undefined');
      });
      it('Threact mounts WebGLRenderer', () => {
        ReactDOM.render(<Container deferred={false}/>, div);
        let canvas = document.querySelectorAll('canvas');
        expect(canvas).to.not.equal(null);
      });
      it('Threact mounts WebGLDeferredRenderer', () => {
        ReactDOM.render(<Container deferred={true}/>, div);
        let canvas = document.querySelectorAll('canvas');
        expect(canvas).to.not.equal(null);
      });
      it('Threact children are rendered', () => {
        const {WebGLRenderer, PointLight, HemisphereLight, Mesh} = t;
        const renderer = ReactTestRenderer.create(
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
            <Mesh
            geometry={new THREE.SphereGeometry( 0.5, 32, 32 )}
            material={new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.5,
              metalness: 1.0
            })}
            position={[1, 0.5, 1]}
            rotation={[0, Math.PI, 0]}
            castShadow={true} />
          </WebGLRenderer>
        );
        expect(renderer.toJSON().children.length).to.equal(1);
      });
      it('Threact children may be null', () => {
        const {WebGLRenderer, PointLight, HemisphereLight, Mesh} = t;
        const renderer = ReactTestRenderer.create(
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
            <Mesh
            geometry={new THREE.SphereGeometry( 0.5, 32, 32 )}
            material={new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.5,
              metalness: 1.0
            })}
            position={[1, 0.5, 1]}
            rotation={[0, Math.PI, 0]}
            castShadow={true} />
            {null}
          </WebGLRenderer>
        );
        expect(renderer.toJSON().children[1].children).to.equal(null);
      });
      it('Threact elements are iterable inside the render method', () => {
        const {WebGLRenderer, PointLight, HemisphereLight, Mesh} = t;
        const sphere = new THREE.SphereGeometry( 0.02, 16, 8 );
        const material = new THREE.MeshStandardMaterial({
          emissive: 0xffffee,
          emissiveIntensity: 1,
          color: 0x000000
        });
        const array = _.fill(Array(20), {
          sphere: sphere,
          material: material,
          position: [0, 0, 0],
          rotation: [- Math.PI / 2, 0, 0]
        })
        const renderer = ReactTestRenderer.create(
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
            {array.map((mesh, i)=>{
              return (
                <Mesh
                key={i}
                geometry={mesh.geometry}
                material={mesh.material}
                position={mesh.position}
                rotation={mesh.rotation} />
              );
            })}
          </WebGLRenderer>
        );
        expect(renderer.toJSON().children.length).to.equal(22);
      });
      it('Threact renderer and children provide onMount and onAnimate callbacks', function (done) {
        this.timeout(5000)
        const {WebGLRenderer, Mesh} = t;
        let mountSpy = sinon.spy();
        let animateSpy = sinon.spy();
        let childMountSpy = sinon.spy();
        let childAnimateSpy = sinon.spy();
        ReactDOM.render(
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
          scene={new THREE.Scene()}
          onMount={mountSpy}
          onAnimate={animateSpy}>
            <Mesh
            geometry={new THREE.SphereGeometry( 0.5, 32, 32 )}
            material={new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.5,
              metalness: 1.0
            })}
            position={[1, 0.5, 1]}
            rotation={[0, Math.PI, 0]}
            castShadow={true}
            onMount={childMountSpy}
            onAnimate={childAnimateSpy} />
          </WebGLRenderer>, div);

        let onMountCallbackArg = mountSpy.lastCall.args[0];
        let cbMountArgKeys = Object.keys(onMountCallbackArg);

        for (let i = 0, len = cbMountArgKeys.length; i < len; i++) {
          expect(typeof onMountCallbackArg[cbMountArgKeys[i]]).to.not.equal('undefined');
        }

        expect(onMountCallbackArg.instance.toneMapping).to.equal(THREE.ReinhardToneMapping);

        // Animate callbacks are called after the canvas is mounted, and threejs rendering has begun.
        _.delay(() => {
          let onAnimateCallbackArg = animateSpy.lastCall.args[0];
          let cbAnimateArgKeys = Object.keys(onAnimateCallbackArg);

          for (let i = 0, len = cbAnimateArgKeys.length; i < len; i++) {
            expect(Promise.resolve(typeof onAnimateCallbackArg[cbAnimateArgKeys[i]])).to.eventually.not.equal('undefined');
          }

          let onChildMountCallbackArg = childMountSpy.lastCall.args[0];
          let cbChildMountArgKeys = Object.keys(onChildMountCallbackArg);

          for (let i = 0, len = cbChildMountArgKeys.length; i < len; i++) {
            expect(Promise.resolve(typeof onChildMountCallbackArg[cbChildMountArgKeys[i]])).to.eventually.not.equal('undefined');
          }

          let onChildAnimateCallbackArg = childAnimateSpy.lastCall.args[0];
          let cbChildAnimateArgKeys = Object.keys(onChildAnimateCallbackArg);

          for (let i = 0, len = cbChildAnimateArgKeys.length; i < len; i++) {
            expect(Promise.resolve(typeof onChildAnimateCallbackArg[cbChildAnimateArgKeys[i]])).to.eventually.not.equal('undefined');
          }
          done();
        }, 1500)
      });
    });
  });

  before(() => {
    document.body.appendChild(div);
  });

  afterEach(function _() {
    try {
      ReactDOM.unmountComponentAtNode(div);
    } catch (e) {}
  });

  after(() => {
    document.body.removeChild(div);
  });
};
