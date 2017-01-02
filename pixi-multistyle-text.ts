/// <reference types="pixi.js" />

"use strict";

export interface ExtendedTextStyle extends PIXI.TextStyleOptions {
	valign?: "top" | "middle" | "bottom";
}

export interface TextStyleSet {
	[key: string]: ExtendedTextStyle;
}

interface FontProperties {
	ascent: number;
	descent: number;
	fontSize: number;
}

interface TextData {
	text: string;
	style: ExtendedTextStyle;
	width: number;
	height: number;
	fontProperties: FontProperties;
}

export class MultiStyleText extends PIXI.Text {
	private textStyles: TextStyleSet;

	constructor(text: string, styles: TextStyleSet) {
		super(text);

		this.styles = styles;
	}

	public set styles(styles: TextStyleSet) {
		this.textStyles = {};

		this.textStyles["default"] = {
			align: "left",
			breakWords: false,
			dropShadow: false,
			dropShadowAngle: Math.PI / 6,
			dropShadowBlur: 0,
			dropShadowColor: "#000000",
			dropShadowDistance: 5,
			fill: "black",
			fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
			fontFamily: "Arial",
			fontSize: 26,
			fontStyle: "normal",
			fontVariant: "normal",
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 0,
			lineJoin: "miter",
			miterLimit: 10,
			padding: 0,
			stroke: "black",
			strokeThickness: 0,
			textBaseline: "alphabetic",
			wordWrap: false,
			wordWrapWidth: 100
		};

		for (let style in styles) {
			if (style === "default") {
				this.assign(this.textStyles["default"], styles[style]);
			} else {
				this.textStyles[style] = this.assign({}, styles[style]);
			}
		}

		this._style = new PIXI.TextStyle(this.textStyles["default"]);
		this.dirty = true;
	}

	private _getTextDataPerLine (lines: string[]) {
		let outputTextData: TextData[][] = [];

		let tags = Object.keys(this.textStyles).join("|");
		let re = new RegExp(`<\/?("${tags})>`, "g");

		let styleStack = [this.assign({}, this.textStyles["default"])];

		// determine the group of word for each line
		for (let i = 0; i < lines.length; i++) {
			let lineTextData: TextData[] = [];

			// find tags inside the string
			let matches: RegExpExecArray[] = [];
			let matchArray: RegExpExecArray;

			while (matchArray = re.exec(lines[i])) {
				matches.push(matchArray);
			}

			// if there is no match, we still need to add the line with the default style
			if (matches.length === 0) {
				lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1]));
			}
			else {
				// We got a match! add the text with the needed style
				let currentSearchIdx = 0;
				for (let j = 0; j < matches.length; j++) {
					// if index > 0, it means we have characters before the match,
					// so we need to add it with the default style
					if (matches[j].index > currentSearchIdx) {
						lineTextData.push(this.createTextData(
							lines[i].substring(currentSearchIdx, matches[j].index),
							styleStack[styleStack.length - 1]
						));
					}

					if (matches[j][0][1] === "/") { // reset the style if end of tag
						if (styleStack.length > 1) {
							styleStack.pop();
						}
					} else { // set the current style
						styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));
					}

					// update the current search index
					currentSearchIdx = matches[j].index + matches[j][0].length;
				}

				// is there any character left?
				if (currentSearchIdx < lines[i].length) {
					lineTextData.push(this.createTextData(
						lines[i].substring(currentSearchIdx),
						styleStack[styleStack.length - 1]
					));
				}
			}

			outputTextData.push(lineTextData);
		}

		return outputTextData;
	}

	private createTextData(text: string, style: ExtendedTextStyle): TextData {
		return {
			text,
			style,
			width: 0,
			height: 0,
			fontProperties: undefined
		};
	}

	public updateText(): void {
		if (!this.dirty) {
			return;
		}

		this.texture.baseTexture.resolution = this.resolution;
		let textStyles = this.textStyles;
		let outputText = this.text;

		// TODO(bluepichu): Reword word wrapping as breakWord is broken
		if(this._style.wordWrap) {
			outputText = this.wordWrap(this.text);
		}

		// split text into lines
		let lines = outputText.split(/(?:\r\n|\r|\n)/);

		// get the text data with specific styles
		let outputTextData = this._getTextDataPerLine(lines);

		// calculate text width and height
		let lineWidths: number[] = [];
		let lineHeights: number[] = [];
		let maxLineWidth = 0;

		for (let i = 0; i < lines.length; i++) {
			let lineWidth = 0;
			let lineHeight = 0;
			for (let j = 0; j < outputTextData[i].length; j++) {
				let sty = outputTextData[i][j].style;

				this.context.font = PIXI.Text.getFontStyle(outputTextData[i][j].style);

				// save the width
				outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;
				lineWidth += outputTextData[i][j].width;

				// save the font properties
				outputTextData[i][j].fontProperties = PIXI.Text.calculateFontProperties(this.context.font);

				// save the height
				outputTextData[i][j].height =
						outputTextData[i][j].fontProperties.fontSize + outputTextData[i][j].style.strokeThickness;
				lineHeight = Math.max(lineHeight, outputTextData[i][j].height);
			}

			lineWidths[i] = lineWidth;
			lineHeights[i] = lineHeight;
			maxLineWidth = Math.max(maxLineWidth, lineWidth);
		}

		// transform styles in array
		let stylesArray = Object.keys(textStyles).map((key) => textStyles[key]);

		let maxStrokeThickness = stylesArray.reduce(
				(prev, curr) => Math.max(prev, curr.strokeThickness || 0),
				0);

		let maxDropShadowDistance = stylesArray.reduce(
				(prev, curr) => Math.max(prev, curr.dropShadow ? (curr.dropShadowDistance || 0) : 0),
				0);

		let maxLineHeight = lineHeights.reduce((prev, curr) => Math.max(prev, curr), 0);

		// define the right width and height
		let width = maxLineWidth + maxStrokeThickness + maxDropShadowDistance;
		let height = (maxLineHeight * lines.length) + maxDropShadowDistance;

		this.canvas.width = (width + this.context.lineWidth) * this.resolution;
		this.canvas.height = height * this.resolution;

		this.context.scale(this.resolution, this.resolution);

		this.context.textBaseline = "alphabetic";
		this.context.lineJoin = "round";

		let basePositionY = 0;

		// Draw the text
		for (let i = 0; i < outputTextData.length; i++) {
			let line = outputTextData[i];
			let linePositionX = 0;

			for (let j = 0; j < line.length; j++) {
				let textStyle = line[j].style;
				let text = line[j].text;
				let fontProperties = line[j].fontProperties;

				this.context.font = PIXI.Text.getFontStyle(textStyle);

				let strokeStyle = textStyle.stroke;
				if (typeof strokeStyle === "number") {
					strokeStyle = PIXI.utils.hex2string(strokeStyle);
				}

				this.context.strokeStyle = strokeStyle;
				this.context.lineWidth = textStyle.strokeThickness;

				linePositionX += maxStrokeThickness / 2;
				let linePositionY = (maxStrokeThickness / 2 + basePositionY) + fontProperties.ascent;

				if (this._style.align === "right") {
					linePositionX += maxLineWidth - lineWidths[i];
				}
				else if (this._style.align === "center" && linePositionX === 0) {
					linePositionX += (maxLineWidth - lineWidths[i]) / 2;
				}

				if (textStyle.valign === "bottom") {
					linePositionY += lineHeights[i] - line[j].height -
						(maxStrokeThickness - textStyle.strokeThickness) / 2;
				} else if (textStyle.valign === "middle") {
					linePositionY += (lineHeights[i] - line[j].height) / 2 -
						(maxStrokeThickness - textStyle.strokeThickness) / 2;
				}

				// draw shadow
				if (textStyle.dropShadow) {
					let dropFillStyle = textStyle.dropShadowColor;
					if (typeof dropFillStyle === "number") {
						dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
					}
					this.context.fillStyle = dropFillStyle;

					let xShadowOffset = Math.sin(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;
					let yShadowOffset = Math.cos(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;

					if (textStyle.fill) {
						this.context.fillText(text, linePositionX + xShadowOffset, linePositionY + yShadowOffset);
					}
				}

				// set canvas text styles
				let fillStyle = textStyle.fill;
				if (typeof fillStyle === "number") {
					fillStyle = PIXI.utils.hex2string(fillStyle);
				} else if (Array.isArray(fillStyle)) {
					for (let i = 0; i < fillStyle.length; i++) {
						let fill = fillStyle[i];
						if (typeof fill === "number") {
							fillStyle[i] = PIXI.utils.hex2string(fill);
						}
					}
				}
				this.context.fillStyle = this._generateFillStyle(new PIXI.TextStyle(textStyle), [text]) as string | CanvasGradient;
				// Typecast required for proper typechecking

				// draw lines
				if (textStyle.stroke && textStyle.strokeThickness) {
					this.context.strokeText(text, linePositionX, linePositionY);
				}

				if (textStyle.fill) {
					this.context.fillText(text, linePositionX, linePositionY);
				}

				// set Position X to the line width
				// remove the strokeThickness otherwise the text will be to far from the previous group
				linePositionX += line[j].width;
				linePositionX -= maxStrokeThickness / 2;
			}

			basePositionY += lineHeights[i];
		}

		this.updateTexture();
	}

	// Lazy fill for Object.assign
	private assign(destination: any, ...sources: any[]): any {
		for (let source of sources) {
			for (let key in source) {
				destination[key] = source[key];
			}
		}

		return destination;
	}
}
