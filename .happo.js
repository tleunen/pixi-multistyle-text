const FirefoxTarget = require('happo-target-firefox');

module.exports = {
	bind: 'localhost',
  port: 4567,
  snapshotsFolder: 'happo-snapshots',
  resultSummaryFilename: 'resultSummary.json',
  uploader: null,
	targets: [
		new FirefoxTarget({
		  bind: '0.0.0.0',
		  port: 4567,
		  sourceFiles: [
        'node_modules/pixi.js-legacy/dist/pixi-legacy.js',
        'dist/pixi-multistyle-text.umd.js',
        'test/tests.js'
		  ],
		  stylesheets: [],
		  publicDirectories: [],
		  viewports: {
        large: {
          width: 2048,
          height: 2048,
        }
		  },
		}),
	]
};
