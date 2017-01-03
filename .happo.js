module.exports = {
	bind: "localhost",
	driver: "chrome",
	port: 4567,
	sourceFiles: [
		"node_modules/pixi.js/dist/pixi.js",
		"dist/pixi-multistyle-text.js",
		"tests.js"
	],
	stylesheets: [],
	publicDirectories: [],
	snapshotsFolder: 'happo-snapshots',
	viewports: {
		large: {
			width: 1024,
			height: 768,
		},
		medium: {
			width: 640,
			height: 888,
		},
		small: {
			width: 320,
			height: 444,
		},
	},
};