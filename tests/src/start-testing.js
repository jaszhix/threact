import 'source-map-support/browser-source-map-support';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import * as THREE from 'three';
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

module.exports = (type) => {
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

        expect(successes + 2).to.equal(Object.keys(t).length);
      });
    });
  });
};
