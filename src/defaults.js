import * as THREE from 'three';

const defaults = {
  // Lights
  AmbientLight: {
    color: 0xffffff,
    intensity: 1
  },
  DirectionalLight: {
    color: 0xffffff,
    intensity: 1
  },
  HemisphereLight: {
    skyColor: 0xffffff,
    groundColor: 0xffffff,
    intensity: 1
  },
  Light: {
    color: 0xffffff,
    intensity: 1
  },
  PointLight: {
    color: 0xffffff,
    intensity: 1,
    distance: 0,
    decay: 1
  },
  RectAreaLight: {
    color: 0xffffff,
    intensity: 1,
    width: 10,
    height: 10
  },
  SpotLight: {
    color: 0xffffff,
    intensity: 1,
    distance: 0,
    angle: 1.0471975511965976,
    penumbra: 0,
    decay: 1
  },

  // Objects
  LensFlare: {
    texture: null,
    size: null,
    distance: null,
    blending: null,
    color: null
  },
  Skeleton: {
    bones: [],
    boneInverses: null
  }
};

export default defaults;