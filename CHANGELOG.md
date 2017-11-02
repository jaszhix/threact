# Changelog

### v0.4.5

 * Cleaned up dependency bloat.

### v0.4.4

 * Switched to using ref callbacks.
 * Minor clean up.

### v0.3.1

 * Fixed the canvas element's style not updating on style prop change.

### v0.3.0

 * Removed unused refs on the instance elements that were triggering React errors.
 * Added a ```style``` prop for the renderer controlling the canvas style.
 * Added a ```deferred``` prop that controls whether or not ```WebGLDeferredRenderer``` is used.
 * ```width``` and ```height``` props now get updated on the renderer when changed.

### v0.2.0

 * Added stats.js performance monitoring.
 * Added support for passes other than shaders.
 * Improved props mapping from constructor properties.
 * Added WebGLDeferredRenderer as a renderer option.
 * Fixed incorrect dependency usage in Webpack.

### v0.1.0

 * Initial commit.
