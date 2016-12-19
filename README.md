# pixi-multistyle-text

[![NPM](https://nodei.co/npm/pixi-multistyle-text.png)](https://nodei.co/npm/pixi-multistyle-text/)

Add a `MultiStyleText` object inside [pixi.js](https://github.com/GoodBoyDigital/pixi.js) to easily create text using different styles.

## Example

In the example below, we are defining 4 text styles.
`default` is the default style for the text, and the others matches the tags inside the text.

```js
var textSample = new MultiStyleText("<pixi>Pixi.js</pixi> can has <multiline>multiline</multiline>\nand <multistyle>multi-styles</multistyle> text!",
	{
		default: { fontFamily: "Tahoma", fontSize: "35px", fill: "white" },
		multiline: { fill: "blue" },
		pixi: { fill: "#D90057" },
		multistyle: { fill: "red" }
	}
);
```

## Usage

### `text = new PIXI.MultiStyleText(text, textStyles)`

Creates a new Multi-Styles Text with the given options

#### `textStyles`
Type: `{ [key: string]: PIXI.TextStyle }`

Each key of this dictionary should match with a tag in the text. Use the key `default` for the default style.

Each style object can have [any of the properties of a standard PIXI text style](http://pixijs.download/release/docs/PIXI.TextStyle.html), in addition to a `valign` property that allows you to specify where text is rendered relative to larger text on the same line (`"top"`, `"middle"`, or `"bottom"`).

The `align`, `wordWrap`, `wordWrapWidth`, and `breakWord` properties are ignored on all styles _except for the `default` style_, which controls those properties for the entire text object.

If text is rendered without any value assigned to a given parameter, Pixi's defaults are used.

## Demo

- Open `demo/index.html` in a browser and you should see something like this:

![img](https://raw.githubusercontent.com/tleunen/pixi-multistyle-text/master/multistyle.png)

## License

MIT, see [LICENSE.md](http://github.com/tleunen/pixi-multistyle-text/blob/master/LICENSE.md) for details.
