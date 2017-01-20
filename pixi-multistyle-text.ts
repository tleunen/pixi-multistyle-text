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

interface TextDrawingData {
	text: string;
	style: ExtendedTextStyle;
	x: number;
	y: number;
}

export default class MultiStyleText extends PIXI.Text {
	private static DEFAULT_TAG_STYLE: ExtendedTextStyle = {
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

	private textStyles: TextStyleSet;

	constructor(text: string, styles: TextStyleSet) {
		super(text);

		this.styles = styles;
	}

	public set styles(styles: TextStyleSet) {
		this.textStyles = {};

		this.textStyles["default"] = this.assign({}, MultiStyleText.DEFAULT_TAG_STYLE);

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

	public setTagStyle(tag: string, style: ExtendedTextStyle): void {
		if (tag in this.textStyles) {
			this.assign(this.textStyles[tag], style);
		} else {
			this.textStyles[tag] = this.assign({}, style);
		}

		this._style = new PIXI.TextStyle(this.textStyles["default"]);
		this.dirty = true;
	}

	public deleteTagStyle(tag: string): void {
		if (tag === "default") {
			this.textStyles["default"] = this.assign({}, MultiStyleText.DEFAULT_TAG_STYLE);
		} else {
			delete this.textStyles[tag];
		}

		this._style = new PIXI.TextStyle(this.textStyles["default"]);
		this.dirty = true;
	}

	private _getTextDataPerLine (lines: string[]) {
		let outputTextData: TextData[][] = [];
		let tags = Object.keys(this.textStyles).join("|");
		let re = new RegExp(`<\/?(${tags})>`, "g");

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

	private getDropShadowPadding(): number {
		let maxDistance = 0;
		let maxBlur = 0;

		 Object.keys(this.textStyles).forEach((styleKey) => {
			let { dropShadowDistance, dropShadowBlur } = this.textStyles[styleKey];
			maxDistance = Math.max(maxDistance, dropShadowDistance || 0);
			maxBlur = Math.max(maxBlur, dropShadowBlur || 0);
		});

		return maxDistance + maxBlur;
	}

	public updateText(): void {
		if (!this.dirty) {
			return;
		}

		this.texture.baseTexture.resolution = this.resolution;
		let textStyles = this.textStyles;
		let outputText = this.text;

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
				if (outputTextData[i][j].text.length == 0) {
					continue;
				}

				let sty = outputTextData[i][j].style;

				this.context.font = PIXI.Text.getFontStyle(sty);

				// save the width
				outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width + (outputTextData[i][j].text.length - 1) * sty.letterSpacing;
				lineWidth += outputTextData[i][j].width;

				if (j > 0) {
					lineWidth += sty.letterSpacing / 2; // spacing before first character
				}

				if (j < outputTextData[i].length - 1) {
					lineWidth += sty.letterSpacing / 2; // spacing after last character
				}

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

		let maxStrokeThickness = stylesArray.reduce((prev, curr) => Math.max(prev, curr.strokeThickness || 0), 0);

		let dropShadowPadding = this.getDropShadowPadding();

		let maxLineHeight = lineHeights.reduce((prev, curr) => Math.max(prev, curr), 0);

		// define the right width and height
		let width = maxLineWidth + maxStrokeThickness + 2 * dropShadowPadding;
		let height = (maxLineHeight * lines.length) + 2 * dropShadowPadding;

		this.canvas.width = (width + this.context.lineWidth) * this.resolution;
		this.canvas.height = height * this.resolution;

		this.context.scale(this.resolution, this.resolution);

		this.context.textBaseline = "alphabetic";
		this.context.lineJoin = "round";

		let basePositionY = dropShadowPadding;

		let drawingData: TextDrawingData[] = [];

		// Compute the drawing data
		for (let i = 0; i < outputTextData.length; i++) {
			let line = outputTextData[i];
			let linePositionX: number;

			switch (this._style.align) {
				case "left":
					linePositionX = dropShadowPadding;
					break;

				case "center":
					linePositionX = dropShadowPadding + (maxLineWidth - lineWidths[i]) / 2;
					break;

				case "right":
					linePositionX = dropShadowPadding + maxLineWidth - lineWidths[i];
					break;
			}

			for (let j = 0; j < line.length; j++) {
				let { style, text, fontProperties } = line[j];

				linePositionX += maxStrokeThickness / 2;

				let linePositionY = maxStrokeThickness / 2 + basePositionY + fontProperties.ascent;

				if (style.valign === "bottom") {
					linePositionY += lineHeights[i] - line[j].height - (maxStrokeThickness - style.strokeThickness) / 2;
				} else if (style.valign === "middle") {
					linePositionY += (lineHeights[i] - line[j].height) / 2 - (maxStrokeThickness - style.strokeThickness) / 2;
				}

				if (style.letterSpacing === 0) {
					drawingData.push({
						text,
						style,
						x: linePositionX,
						y: linePositionY
					});

					linePositionX += line[j].width;
				} else {
					this.context.font = PIXI.Text.getFontStyle(line[j].style);

					for (let k = 0; k < text.length; k++) {
						if (k > 0 || j > 0) {
							linePositionX += style.letterSpacing / 2;
						}

						drawingData.push({
							text: text.charAt(k),
							style,
							x: linePositionX,
							y: linePositionY
						});

						linePositionX += this.context.measureText(text.charAt(k)).width;

						if (k < text.length - 1 || j < line.length - 1) {
							linePositionX += style.letterSpacing / 2;
						}
					}
				}

				linePositionX -= maxStrokeThickness / 2;
			}

			basePositionY += lineHeights[i];
		}

		this.context.save();

		// First pass: draw the shadows only
		drawingData.forEach(({ style, text, x, y }) => {
			if (!style.dropShadow) {
				return; // This text doesn't have a shadow
			}

			this.context.font = PIXI.Text.getFontStyle(style);

			let dropFillStyle = style.dropShadowColor;
			if (typeof dropFillStyle === "number") {
				dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
			}
			this.context.shadowColor = dropFillStyle;
			this.context.shadowBlur = style.dropShadowBlur;
			this.context.shadowOffsetX = Math.cos(style.dropShadowAngle) * style.dropShadowDistance * this.resolution;
			this.context.shadowOffsetY = Math.sin(style.dropShadowAngle) * style.dropShadowDistance * this.resolution;

			this.context.fillText(text, x, y);
		});

		this.context.restore();

		// Second pass: draw strokes and fills
		drawingData.forEach(({ style, text, x, y }) => {
			this.context.font = PIXI.Text.getFontStyle(style);

			let strokeStyle = style.stroke;
			if (typeof strokeStyle === "number") {
				strokeStyle = PIXI.utils.hex2string(strokeStyle);
			}

			this.context.strokeStyle = strokeStyle;
			this.context.lineWidth = style.strokeThickness;

			// set canvas text styles
			let fillStyle = style.fill;
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
			this.context.fillStyle = this._generateFillStyle(new PIXI.TextStyle(style), [text]) as string | CanvasGradient;
			// Typecast required for proper typechecking

			if (style.stroke && style.strokeThickness) {
				this.context.strokeText(text, x, y);
			}

			if (style.fill) {
				this.context.fillText(text, x, y);
			}
		});

		this.updateTexture();
	}

	protected wordWrap(text: string): string {
		// Greedy wrapping algorithm that will wrap words as the line grows longer than its horizontal bounds.
		let result = '';
		let tags = Object.keys(this.textStyles).join("|");
		let re = new RegExp(`(<\/?(${tags})>)`, "g");

		const lines = text.split("\n");
		const wordWrapWidth = this._style.wordWrapWidth;
		let styleStack = [this.assign({}, this.textStyles["default"])];
		this.context.font = PIXI.Text.getFontStyle(this.textStyles["default"]);

		for (let i = 0; i < lines.length; i++) {
			let spaceLeft = wordWrapWidth;
			const words = lines[i].split(" ");

			for (let j = 0; j < words.length; j++) {
				const parts = words[j].split(re);

				for (let k = 0; k < parts.length; k++) {
					if (re.test(parts[k])) {
						result += parts[k];
						if (parts[k][1] === "/") {
							k++;
							styleStack.pop();
						} else {
							k++;
							styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[parts[k]]));
						}
						this.context.font = PIXI.Text.getFontStyle(styleStack[styleStack.length - 1]);
						continue;
					}

					const partWidth = this.context.measureText(parts[k]).width;

					if (this._style.breakWords && partWidth > wordWrapWidth) {
						// Part should be split in the middle
						const characters = parts[k].split('');

						if (j > 0 && k === 0) {
							result += " ";
							spaceLeft -= this.context.measureText(" ").width;
						}

						for (let c = 0; c < characters.length; c++) {
							const characterWidth = this.context.measureText(characters[c]).width;

							if (characterWidth > spaceLeft) {
								result += `\n${characters[c]}`;
								spaceLeft = wordWrapWidth - characterWidth;
							} else {
								if (j > 0 && k === 0 && c === 0) {
									result += " ";
								}

								result += characters[c];
								spaceLeft -= characterWidth;
							}
						}
					} else {
						const paddedPartWidth =
							partWidth + (k === 0 ? this.context.measureText(" ").width : 0);

						if (j === 0 || paddedPartWidth > spaceLeft) {
							// Skip printing the newline if it's the first word of the line that is
							// greater than the word wrap width.
							if (j > 0) {
								result += "\n";
							}
							result += parts[k];
							spaceLeft = wordWrapWidth - partWidth;
						} else {
							spaceLeft -= paddedPartWidth;

							if (k === 0) {
								result += " ";
							}

							result += parts[k];
						}
					}
				}
			}

			if (i < lines.length - 1) {
				result += '\n';
			}
		}

		return result;
	}

	protected updateTexture() {
		const texture = this._texture;

		let dropShadowPadding = this.getDropShadowPadding();

		texture.baseTexture.hasLoaded = true;
		texture.baseTexture.resolution = this.resolution;

		texture.baseTexture.realWidth = this.canvas.width;
		texture.baseTexture.realHeight = this.canvas.height;
		texture.baseTexture.width = this.canvas.width / this.resolution;
		texture.baseTexture.height = this.canvas.height / this.resolution;
		texture.trim.width = texture.frame.width = this.canvas.width / this.resolution;
		texture.trim.height = texture.frame.height = this.canvas.height / this.resolution;

		texture.trim.x = -this._style.padding - dropShadowPadding;
		texture.trim.y = -this._style.padding - dropShadowPadding;

		texture.orig.width = texture.frame.width - (this._style.padding + dropShadowPadding) * 2;
		texture.orig.height = texture.frame.height - (this._style.padding + dropShadowPadding) * 2;

		// call sprite onTextureUpdate to update scale if _width or _height were set
		this._onTextureUpdate();

		texture.baseTexture.emit('update', texture.baseTexture);

		this.dirty = false;
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
