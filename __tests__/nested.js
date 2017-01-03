it("should render a simple example correctly", () => {
	require("./support/pixi-shim");

	const MultiStyleText = require("../dist/pixi-multistyle-text");

	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(400, 80);
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

	nested.x = 200 - nested.width / 2;
	nested.y = 20;
	stage.addChild(nested);

	renderer.render(stage);

	let canvas = document.getElementsByTagName("canvas")[0];
	expect(canvas.toDataURL()).toMatchSnapshot();
});