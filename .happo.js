module.exports = {
	bind: "localhost",
	driver: "chrome",
	port: 4567,
	sourceFiles: [
		"node_modules/pixi.js/dist/pixi.js",
		"dist/pixi-multistyle-text.js",
		"test/tests.js"
	],
	stylesheets: [],
	publicDirectories: [],
	snapshotsFolder: 'happo-snapshots',
	viewports: {
		large: {
			width: 2048,
			height: 2048,
		}
	},
};