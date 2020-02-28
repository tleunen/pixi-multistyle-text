const WIDTH = 600;
const HEIGHT = 500;

function test(fn) {
  return () => {
    document.body.innerHTML = "<div id='root'></div>";
    PIXI.settings.RESOLUTION = 2;
    let renderer = PIXI.autoDetectRenderer(2 * WIDTH, 2 * HEIGHT);
    renderer.backgroundColor = 0x333333;
    document.getElementById("root").appendChild(renderer.view);

    let stage = new PIXI.Container();
    let text = fn();

    text.x = (WIDTH - text.width) / 2;
    text.y = 20;

    stage.addChild(text);

    renderer.render(stage);
  };
}

happo.define(
  "Basic example",
  test(
    () =>
      new MultiStyleText(
        "Let's make some <ml>multiline</ml>\nand <ms>multistyle</ms> text for\n<pixi>Pixi.js!</pixi>",
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
            align: "center",
          },
          ml: {
            fontStyle: "italic",
            fill: "#ff8888",
          },
          ms: {
            fontStyle: "italic",
            fill: "#4488ff",
          },
          pixi: {
            fontSize: "64px",
            fill: "#efefef",
          },
        }
      )
  )
);

happo.define(
  "Nested tags",
  test(
    () =>
      new MultiStyleText(
        "You can <outline>nest <b>tags <red>as <i>deeply <thicker>as <shadow>you'd <large>like</large></shadow></thicker></i></red></b></outline>",
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
            valign: "bottom",
          },
          outline: { stroke: "black", strokeThickness: 2 },
          b: { fontWeight: 700 },
          red: { fill: "#ff8888" },
          i: { fontStyle: "italic" },
          thicker: { strokeThickness: 6 },
          shadow: { dropShadow: true, dropShadowColor: "#888888" },
          large: { fontSize: "36px" },
        }
      )
  )
);

happo.define(
  "Vertical alignment",
  test(
    () =>
      new MultiStyleText(
        "You can use <code>valign</code> to control the <top>vertical</top> <middle>alignment</middle> of <bottom>text</bottom>.",
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
          },
          code: {
            fontFamily: "Inconsolata",
            fill: "#ff8888",
            valign: "bottom",
          },
          top: { fontSize: "14px", valign: "top" },
          middle: { fontSize: "14px", valign: "middle" },
          bottom: { fontSize: "14px", valign: "bottom" },
        }
      )
  )
);

happo.define(
  "Wrapping and alignment",
  test(
    () =>
      new MultiStyleText(
        'Global word wrap and alignment properties are controlled by the "default" style, and can\'t be overridden by other styles.',
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
            wordWrap: true,
            wordWrapWidth: 150,
            align: "right",
          },
        }
      )
  )
);

happo.define(
  "Have fun",
  test(
    () =>
      new MultiStyleText(
        "Now have fun making some <blue>beautiful</blue> <red>multistyle</red> text!",
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
            strokeThickness: 1,
            stroke: "#aaaaaa",
            dropShadow: true,
            dropShadowBlur: 10,
            dropShadowDistance: 8,
            dropShadowAngle: 0,
          },
          blue: { fill: 0x4488ff, stroke: 0x2244cc },
          red: { fill: 0xff8888, stroke: 0xcc4444 },
        }
      )
  )
);

happo.define(
  "Break Words",
  test(
    () =>
      new MultiStyleText(
        "Thisblockoftextshouldbebrokenacrosslinesbecausebreakwordsisset.",
        {
          default: {
            fontFamily: "Arial",
            fontSize: "24px",
            fill: "#cccccc",
            wordWrap: true,
            wordWrapWidth: 150,
            breakWords: true,
          },
        }
      )
  )
);
