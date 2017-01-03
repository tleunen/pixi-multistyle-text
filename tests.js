happo.define("Basic example", () => {
	document.body.innerHTML = "<div id='root'></div>";
	PIXI.settings.RESOLUTION = 2;
	let renderer = PIXI.autoDetectRenderer(400, 200);
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