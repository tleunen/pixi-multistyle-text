happo.define("Basic example", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(800, 400);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

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

	text.x = 200 - text.width / 2;
	text.y = 10;
	stage.addChild(text);

	renderer.render(stage);
});

happo.define("Nested tags", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(1200, 400);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

	let nested = new MultiStyleText("You can <outline>nest <b>tags <red>as <i>deeply <thicker>as <shadow>you'd <large>like</large></shadow></thicker></i></red></b></outline>",
	{
		"default": {
			fontFamily: "Arial",
			fontSize: "24px",
			fill: "#cccccc",
			valign: "bottom"
		},
		"outline": { stroke: "black", strokeThickness: 2 },
		"b": { fontWeight: 700 },
		"red": { fill: "#ff8888" },
		"i": { fontStyle: "italic" },
		"thicker": { strokeThickness: 6 },
		"shadow": { dropShadow: true, dropShadowColor: "#888888" },
		"large": { fontSize: "36px" }
	});

	nested.x = 300 - nested.width / 2;
	nested.y = 20;
	stage.addChild(nested);

	renderer.render(stage);
});

happo.define("Vertical alignment", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(1200, 400);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

	let valign = new MultiStyleText("You can use <code>valign</code> to control the <top>vertical</top> <middle>alignment</middle> of <bottom>text</bottom>.",
	{
		"default": {
			fontFamily: "Arial",
			fontSize: "24px",
			fill: "#cccccc"
		},
		"code": { fontFamily: "Inconsolata", fill: "#ff8888", valign: "bottom" },
		"top": { fontSize: "14px", valign: "top" },
		"middle": { fontSize: "14px", valign: "middle" },
		"bottom": { fontSize: "14px", valign: "bottom" }
	});

	valign.x = 300 - valign.width / 2;
	valign.y = 20;
	stage.addChild(valign);

	renderer.render(stage);
});

happo.define("Wrapping and alignment", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(800, 600);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

	let wrapping = new MultiStyleText("Global word wrap and alignment properties are controlled by the \"default\" style, and can't be overridden by other styles.",
	{
		"default": {
			fontFamily: "Arial",
			fontSize: "24px",
			fill: "#cccccc",
			wordWrap: true,
			wordWrapWidth: 150,
			align: "right"
		}
	});

	wrapping.x = 350 - wrapping.width;
	wrapping.y = 20;
	stage.addChild(wrapping);

	renderer.render(stage);
});

happo.define("Have fun", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(1200, 400);
	renderer.backgroundColor = 0x333333;
	document.getElementById("root").appendChild(renderer.view);
	let stage = new PIXI.Container();

	let funStyles = {
		"default": {
			fontFamily: "Arial",
			fontSize: "24px",
			fill: "#cccccc",
			strokeThickness: 1,
			stroke: "#aaaaaa",
			dropShadow: true,
			dropShadowBlur: 10,
			dropShadowDistance: 8,
			dropShadowAngle: 0
		},
		"blue": { fill: 0x4488ff, stroke: 0x2244cc },
		"red": { fill: 0xff8888, stroke: 0xcc4444 }
	};

	let fun = new MultiStyleText("Now have fun making some <blue>beautiful</blue> <red>multistyle</red> text!", funStyles);

	fun.x = 300 - fun.width / 2;
	fun.y = 20;
	stage.addChild(fun);

	renderer.render(stage);
});