# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.7.0"></a>
# [0.7.0](https://github.com/tleunen/pixi-multistyle-text/compare/v0.6.0...v0.7.0) (2018-10-29)


### Bug Fixes

* Fix Stroke thickness issues ([#73](https://github.com/tleunen/pixi-multistyle-text/issues/73)) ([36cfc62](https://github.com/tleunen/pixi-multistyle-text/commit/36cfc62)), closes [#59](https://github.com/tleunen/pixi-multistyle-text/issues/59) [#60](https://github.com/tleunen/pixi-multistyle-text/issues/60)
* text not rendered when `stroke` or `fill` is 0x000000 ([#69](https://github.com/tleunen/pixi-multistyle-text/issues/69)) ([aa0e7de](https://github.com/tleunen/pixi-multistyle-text/commit/aa0e7de))


### Chores

* fix happo, use microbundle to create the dist files, use circleci v2 ([#63](https://github.com/tleunen/pixi-multistyle-text/issues/63)) ([56c7a80](https://github.com/tleunen/pixi-multistyle-text/commit/56c7a80))


### BREAKING CHANGES

* Since we now use microbundle to create the library. The output changes a bit and the output file in a CJS file only. If you need to use the library with a script tag, you should use the UMD build.



<a name="0.6.0"></a>
# [0.6.0](https://github.com/tleunen/pixi-multistyle-text/compare/v0.5.4...v0.6.0) (2017-07-17)


### Feat

* Add more valign options and a debug mode ([#51](https://github.com/tleunen/pixi-multistyle-text/issues/51)) ([49c9326](https://github.com/tleunen/pixi-multistyle-text/commit/49c9326)), closes [#41](https://github.com/tleunen/pixi-multistyle-text/issues/41) [#48](https://github.com/tleunen/pixi-multistyle-text/issues/48)


### BREAKING CHANGES

* The default text style changed from `bottom` to `baseline`.



<a name="0.5.4"></a>
## [0.5.4](https://github.com/tleunen/pixi-multistyle-text/compare/v0.5.3...v0.5.4) (2017-06-30)


### Bug Fixes

* styled text not wrapped correctly when breakWords is true ([#47](https://github.com/tleunen/pixi-multistyle-text/issues/47)) ([f3bb028](https://github.com/tleunen/pixi-multistyle-text/commit/f3bb028))



<a name="0.5.3"></a>
## [0.5.3](https://github.com/tleunen/pixi-multistyle-text/compare/v0.5.2...v0.5.3) (2017-06-12)



<a name="0.5.2"></a>
## [0.5.2](https://github.com/tleunen/pixi-multistyle-text/compare/v0.5.1...v0.5.2) (2017-03-29)


### Bug Fixes

* Compute font properties for empty line parts ([#43](https://github.com/tleunen/pixi-multistyle-text/issues/43)) ([228c371](https://github.com/tleunen/pixi-multistyle-text/commit/228c371)), closes [#42](https://github.com/tleunen/pixi-multistyle-text/issues/42)



<a name="0.5.1"></a>
## [0.5.1](https://github.com/tleunen/pixi-multistyle-text/compare/v0.5.0...v0.5.1) (2017-01-20)


### Bug Fixes

* Fix letterSpacing property ([#40](https://github.com/tleunen/pixi-multistyle-text/issues/40)) ([55d8866](https://github.com/tleunen/pixi-multistyle-text/commit/55d8866)), closes [#39](https://github.com/tleunen/pixi-multistyle-text/issues/39)
* wordWrap() - Don't add spaces before the first word on a line ([#38](https://github.com/tleunen/pixi-multistyle-text/issues/38)) ([2060ce0](https://github.com/tleunen/pixi-multistyle-text/commit/2060ce0)), closes [#37](https://github.com/tleunen/pixi-multistyle-text/issues/37)



<a name="0.5.0"></a>
# [0.5.0](https://github.com/tleunen/pixi-multistyle-text/compare/v0.4.0...v0.5.0) (2017-01-16)


### Bug Fixes

* Add offset for stroke after checking alignment ([#24](https://github.com/tleunen/pixi-multistyle-text/issues/24)) ([5d63a3a](https://github.com/tleunen/pixi-multistyle-text/commit/5d63a3a)), closes [#22](https://github.com/tleunen/pixi-multistyle-text/issues/22)
* Fix build errors ([#14](https://github.com/tleunen/pixi-multistyle-text/issues/14)) ([4fee646](https://github.com/tleunen/pixi-multistyle-text/commit/4fee646)), closes [#10](https://github.com/tleunen/pixi-multistyle-text/issues/10)
* Fix drop shadows ([2cc378c](https://github.com/tleunen/pixi-multistyle-text/commit/2cc378c)), closes [#26](https://github.com/tleunen/pixi-multistyle-text/issues/26)
* Fix exported module ([#18](https://github.com/tleunen/pixi-multistyle-text/issues/18)) ([cf527eb](https://github.com/tleunen/pixi-multistyle-text/commit/cf527eb)), closes [#12](https://github.com/tleunen/pixi-multistyle-text/issues/12)
* Fix line y-position computation bug ([#17](https://github.com/tleunen/pixi-multistyle-text/issues/17)) ([6aa7636](https://github.com/tleunen/pixi-multistyle-text/commit/6aa7636)), closes [#11](https://github.com/tleunen/pixi-multistyle-text/issues/11)
* Override wordWrap method to ignore tags ([#20](https://github.com/tleunen/pixi-multistyle-text/issues/20)) ([662d1e6](https://github.com/tleunen/pixi-multistyle-text/commit/662d1e6)), closes [#9](https://github.com/tleunen/pixi-multistyle-text/issues/9) [#16](https://github.com/tleunen/pixi-multistyle-text/issues/16)
* Right-alignment-pad first word only ([#25](https://github.com/tleunen/pixi-multistyle-text/issues/25)) ([65eb1f3](https://github.com/tleunen/pixi-multistyle-text/commit/65eb1f3)), closes [#23](https://github.com/tleunen/pixi-multistyle-text/issues/23)


### Features

* Add `setTagStyle()` and `deleteTagStyle()` ([588f21b](https://github.com/tleunen/pixi-multistyle-text/commit/588f21b)), closes [#34](https://github.com/tleunen/pixi-multistyle-text/issues/34)
