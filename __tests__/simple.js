it("should render a simple example correctly", () => {
	document.body.innerHTML = "<div id='root'></div>";

	global.window = document.defaultView;
	global.window.document = global.document;

	global.Canvas = require('canvas');
	global.Image = require('canvas').Image;

	// Node canvas Image's dont currently have `addEventListener` so we fake it for now.
	// We can always make updates to the node-canvas lib
	global.Image.prototype.addEventListener = function(event, fn) {
	    const img = this;

	    switch (event) {
	        case 'error':
	            img.onerror = function() {
	                img.onerror = null;
	                img.onload = null;
	                fn.call(img);
	            };
	            break;

	        case 'load':
	            img.onload = function() {
	                img.onerror = null;
	                img.onload = null;
	                fn.call(img);
	            };
	            break;
	    }
	};

	global.Image.prototype.removeEventListener = function() {};
	global.navigator = { userAgent: 'node.js' }; // could be anything
	global.PIXI = require("pixi.js");

	const MultiStyleText = require("../dist/pixi-multistyle-text");

	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(600, 400);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

	// Basics
	let text = new MultiStyleText("Let's make some <ml>multiline</ml>\nand <ms>multistyle</ms> text for\n<pixi>Pixi.js!</pixi>",
	{
		"default": {
			fontFamily: "Arial",
			fontSize: "24px",
			fill: "#cccccc",
			align: "center"
		},
		"ml": {
			fontStyle: "italic",
			fill: "#ff8888"
		},
		"ms": {
			fontStyle: "italic",
			fill: "#4488ff"
		},
		"pixi": {
			fontSize: "64px",
			fill: "#efefef"
		}
	});

	text.x = 300 - text.width / 2;
	text.y = 150;
	stage.addChild(text);

	renderer.render(stage);

	let canvas = document.getElementsByTagName("canvas")[0];
	expect(canvas.toDataURL()).toMatchSnapshot();
});