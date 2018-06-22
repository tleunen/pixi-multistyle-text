/// <reference types="pixi.js" />

"use strict";

export interface ExtendedTextStyle extends PIXI.TextStyleOptions {
	valign?: "top" | "middle" | "bottom" | "baseline" | number;
	debug?: boolean;
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
	tag: TagData;
}

interface TextDrawingData {
	text: string;
	style: ExtendedTextStyle;
	x: number;
	y: number;
	width: number;
	ascent: number;
	descent: number;
	tag: TagData;
}

export interface MstDebugOptions {
	spans: {
		enabled?: boolean;
		baseline?: string;
		top?: string;
		bottom?: string;
		bounding?: string;
		text?: boolean;
	};
	objects: {
		enabled?: boolean;
		bounding?: string;
		text?: boolean;
	}
}

export interface TagData {
	name: string;
	properties: { [key: string]: string };
}

export interface MstInteractionEvent extends PIXI.interaction.InteractionEvent {
	targetTag: TagData;
}

const INTERACTION_EVENTS = [
	"pointerover",
	"pointerenter",
	"pointerdown",
	"pointermove",
	"pointerup",
	"pointercancel",
	"pointerout",
	"pointerleave",
	"gotpointercapture",
	"lostpointercapture",
	"mouseover",
	"mouseenter",
	"mousedown",
	"mousemove",
	"mouseup",
	"mousecancel",
	"mouseout",
	"mouseleave",
	"touchover",
	"touchenter",
	"touchdown",
	"touchmove",
	"touchup",
	"touchcancel",
	"touchout",
	"touchleave"
];

export default class MultiStyleText extends PIXI.Text {
	private static DEFAULT_TAG_STYLE: ExtendedTextStyle = {
		align: "left",
		breakWords: false,
		// debug intentionally not included
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
		valign: "baseline",
		wordWrap: false,
		wordWrapWidth: 100
	};

	public static debugOptions: MstDebugOptions = {
		spans: {
			enabled: false,
			baseline: "#44BB44",
			top: "#BB4444",
			bottom: "#4444BB",
			bounding: "rgba(255, 255, 255, 0.1)",
			text: true
		},
		objects: {
			enabled: false,
			bounding: "rgba(255, 255, 255, 0.05)",
			text: true
		}
	};

	private textStyles: TextStyleSet;

	private hitboxes: { tag: TagData, hitbox: PIXI.Rectangle }[];

	constructor(text: string, styles: TextStyleSet) {
		super(text);

		this.styles = styles;

		INTERACTION_EVENTS.forEach((event) => {
			this.on(event, (e: PIXI.interaction.InteractionEvent) => this.handleInteraction(e));
		});
	}

	private handleInteraction(e: PIXI.interaction.InteractionEvent) {
		let ev = e as MstInteractionEvent;

		let localPoint = e.data.getLocalPosition(this);
		let targetTag = this.hitboxes.reduce((prev, hitbox) => prev !== undefined ? prev : (hitbox.hitbox.contains(localPoint.x, localPoint.y) ? hitbox : undefined), undefined);
		ev.targetTag = targetTag === undefined ? undefined : targetTag.tag;
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

	private getTagRegex(captureName: boolean, captureMatch: boolean): RegExp {
		let tagAlternation = Object.keys(this.textStyles).join("|");

		if (captureName) {
			tagAlternation = `(${tagAlternation})`;
		} else {
			tagAlternation = `(?:${tagAlternation})`;
		}

		let reStr = `<${tagAlternation}(?:\\s+[A-Za-z0-9_\\-]+=(?:"(?:[^"]+|\\\\")*"|'(?:[^']+|\\\\')*'))*\\s*>|</${tagAlternation}\\s*>`;

		if (captureMatch) {
			reStr = `(${reStr})`;
		}

		return new RegExp(reStr, "g");
	}

	private getPropertyRegex(): RegExp {
		return new RegExp(`([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`, "g");
	}

	private _getTextDataPerLine (lines: string[]) {
		let outputTextData: TextData[][] = [];
		let re = this.getTagRegex(true, false);

		let styleStack = [this.assign({}, this.textStyles["default"])];
		let tagStack: TagData[] = [{ name: "default", properties: {} }];

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
				lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1], tagStack[tagStack.length - 1]));
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
							styleStack[styleStack.length - 1],
							tagStack[tagStack.length - 1]
						));
					}

					if (matches[j][0][1] === "/") { // reset the style if end of tag
						if (styleStack.length > 1) {
							styleStack.pop();
							tagStack.pop();
						}
					} else { // set the current style
						styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));

						let properties: { [key: string]: string } = {};
						let propertyRegex = this.getPropertyRegex();
						let propertyMatch: RegExpMatchArray;

						while (propertyMatch = propertyRegex.exec(matches[j][0])) {
							properties[propertyMatch[1]] = propertyMatch[2] || propertyMatch[3];
						}

						tagStack.push({ name: matches[j][1], properties });
					}

					// update the current search index
					currentSearchIdx = matches[j].index + matches[j][0].length;
				}

				// is there any character left?
				if (currentSearchIdx < lines[i].length) {
					lineTextData.push(this.createTextData(
						lines[i].substring(currentSearchIdx),
						styleStack[styleStack.length - 1],
						tagStack[tagStack.length - 1]
					));
				}
			}

			outputTextData.push(lineTextData);
		}

		return outputTextData;
	}

	private getFontString(style: ExtendedTextStyle): string {
		return new PIXI.TextStyle(style).toFontString();
	}

	private createTextData(text: string, style: ExtendedTextStyle, tag: TagData): TextData {
		return {
			text,
			style,
			width: 0,
			height: 0,
			fontProperties: undefined,
			tag
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

		this.hitboxes = [];

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
		let lineYMins: number[] = [];
		let lineYMaxs: number[] = [];
		let baselines: number[] = [];
		let maxLineWidth = 0;

		for (let i = 0; i < lines.length; i++) {
			let lineWidth = 0;
			let lineYMin = 0;
			let lineYMax = 0;
			let baseline = 0;
			for (let j = 0; j < outputTextData[i].length; j++) {
				let sty = outputTextData[i][j].style;

				this.context.font = this.getFontString(sty);

				// save the width
				outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;

				if (outputTextData[i][j].text.length === 0) {
					outputTextData[i][j].width += (outputTextData[i][j].text.length - 1) * sty.letterSpacing;

					if (j > 0) {
						lineWidth += sty.letterSpacing / 2; // spacing before first character
					}

					if (j < outputTextData[i].length - 1) {
						lineWidth += sty.letterSpacing / 2; // spacing after last character
					}
				}

				lineWidth += outputTextData[i][j].width;

				// save the font properties
				outputTextData[i][j].fontProperties = PIXI.TextMetrics.measureFont(this.context.font);

				// save the height
				outputTextData[i][j].height =
						outputTextData[i][j].fontProperties.fontSize + outputTextData[i][j].style.strokeThickness;

				if (typeof sty.valign === "number") {
					lineYMin = Math.min(lineYMin, sty.valign - outputTextData[i][j].fontProperties.descent);
					lineYMax = Math.max(lineYMax, sty.valign + outputTextData[i][j].fontProperties.ascent);
				} else {
					lineYMin = Math.min(lineYMin, -outputTextData[i][j].fontProperties.descent);
					lineYMax = Math.max(lineYMax, outputTextData[i][j].fontProperties.ascent);
				}
			}

			lineWidths[i] = lineWidth;
			lineYMins[i] = lineYMin;
			lineYMaxs[i] = lineYMax;
			maxLineWidth = Math.max(maxLineWidth, lineWidth);
		}

		// transform styles in array
		let stylesArray = Object.keys(textStyles).map((key) => textStyles[key]);

		let maxStrokeThickness = stylesArray.reduce((prev, cur) => Math.max(prev, cur.strokeThickness || 0), 0);

		let dropShadowPadding = this.getDropShadowPadding();

		let totalHeight = lineYMaxs.reduce((prev, cur) => prev + cur, 0) - lineYMins.reduce((prev, cur) => prev + cur, 0);

		// define the right width and height
		let width = maxLineWidth + maxStrokeThickness + 2 * dropShadowPadding;
		let height = totalHeight + 2 * dropShadowPadding;

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
				let { style, text, fontProperties, width, height, tag } = line[j];

				linePositionX += maxStrokeThickness / 2;

				let linePositionY = maxStrokeThickness / 2 + basePositionY + fontProperties.ascent;

				switch (style.valign) {
					case "top":
						// no need to do anything
						break;

					case "baseline":
						linePositionY += lineYMaxs[i] - fontProperties.ascent;
						break;

					case "middle":
						linePositionY += (lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent) / 2;
						break;

					case "bottom":
						linePositionY += lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent;
						break;

					default:
						// A number - offset from baseline, positive is higher
						linePositionY += lineYMaxs[i] - fontProperties.ascent - style.valign;
						break;
				}

				if (style.letterSpacing === 0) {
					drawingData.push({
						text,
						style,
						x: linePositionX,
						y: linePositionY,
						width,
						ascent: fontProperties.ascent,
						descent: fontProperties.descent,
						tag
					});

					linePositionX += line[j].width;
				} else {
					this.context.font = this.getFontString(line[j].style);

					for (let k = 0; k < text.length; k++) {
						if (k > 0 || j > 0) {
							linePositionX += style.letterSpacing / 2;
						}

						drawingData.push({
							text: text.charAt(k),
							style,
							x: linePositionX,
							y: linePositionY,
							width,
							ascent: fontProperties.ascent,
							descent: fontProperties.descent,
							tag
						});

						linePositionX += this.context.measureText(text.charAt(k)).width;

						if (k < text.length - 1 || j < line.length - 1) {
							linePositionX += style.letterSpacing / 2;
						}
					}
				}

				linePositionX -= maxStrokeThickness / 2;
			}

			basePositionY += lineYMaxs[i] - lineYMins[i];
		}

		this.context.save();

		// First pass: draw the shadows only
		drawingData.forEach(({ style, text, x, y }) => {
			if (!style.dropShadow) {
				return; // This text doesn't have a shadow
			}

			this.context.font = this.getFontString(style);

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
		drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
			this.context.font = this.getFontString(style);

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

			let offset = -this._style.padding - this.getDropShadowPadding();

			this.hitboxes.push({
				tag,
				hitbox: new PIXI.Rectangle(x + offset, y - ascent + offset, width, ascent + descent)
			});

			let debugSpan = style.debug === undefined
				? MultiStyleText.debugOptions.spans.enabled
				: style.debug;

			if (debugSpan) {
				this.context.lineWidth = 1;

				if (MultiStyleText.debugOptions.spans.bounding) {
					this.context.fillStyle = MultiStyleText.debugOptions.spans.bounding;
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.bounding;
					this.context.beginPath();
					this.context.rect(x, y - ascent, width, ascent + descent);
					this.context.fill();
					this.context.stroke();
					this.context.stroke(); // yes, twice
				}

				if (MultiStyleText.debugOptions.spans.baseline) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.baseline;
					this.context.beginPath();
					this.context.moveTo(x, y);
					this.context.lineTo(x + width, y);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.top) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.top;
					this.context.beginPath();
					this.context.moveTo(x, y - ascent);
					this.context.lineTo(x + width, y - ascent);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.bottom) {
					this.context.strokeStyle = MultiStyleText.debugOptions.spans.bottom;
					this.context.beginPath();
					this.context.moveTo(x, y + descent);
					this.context.lineTo(x + width, y + descent);
					this.context.closePath();
					this.context.stroke();
				}

				if (MultiStyleText.debugOptions.spans.text) {
					this.context.fillStyle = "#ffffff";
					this.context.strokeStyle = "#000000";
					this.context.lineWidth = 2;
					this.context.font = "8px monospace";
					this.context.strokeText(tag.name, x, y - ascent + 8);
					this.context.fillText(tag.name, x, y - ascent + 8);
					this.context.strokeText(`${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`, x, y - ascent + 16);
					this.context.fillText(`${width.toFixed(2)}x${(ascent + descent).toFixed(2)}`, x, y - ascent + 16);
				}
			}
		});

		if (MultiStyleText.debugOptions.objects.enabled) {
			if (MultiStyleText.debugOptions.objects.bounding) {
				this.context.fillStyle = MultiStyleText.debugOptions.objects.bounding;
				this.context.beginPath();
				this.context.rect(0, 0, width, height);
				this.context.fill();
			}

			if (MultiStyleText.debugOptions.objects.text) {
				this.context.fillStyle = "#ffffff";
				this.context.strokeStyle = "#000000";
				this.context.lineWidth = 2;
				this.context.font = "8px monospace";
				this.context.strokeText(`${width.toFixed(2)}x${height.toFixed(2)}`, 0, 8, width);
				this.context.fillText(`${width.toFixed(2)}x${height.toFixed(2)}`, 0, 8, width);
			}
		}

		this.updateTexture();
	}

	protected wordWrap(text: string): string {
		// Greedy wrapping algorithm that will wrap words as the line grows longer than its horizontal bounds.
		let result = "";
		let re = this.getTagRegex(true, true);

		const lines = text.split("\n");
		const wordWrapWidth = this._style.wordWrapWidth;
		let styleStack = [this.assign({}, this.textStyles["default"])];
		this.context.font = this.getFontString(this.textStyles["default"]);

		for (let i = 0; i < lines.length; i++) {
			let spaceLeft = wordWrapWidth;
			const tagSplit = lines[i].split(re);
			let firstWordOfLine = true;

			for (let j = 0; j < tagSplit.length; j++) {
				if (re.test(tagSplit[j])) {
					result += tagSplit[j];
					if (tagSplit[j][1] === "/") {
						j += 2;
						styleStack.pop();
					} else {
						j++;
						styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[tagSplit[j]]));
						j++;
					}
					this.context.font = this.getFontString(styleStack[styleStack.length - 1]);
				} else {
					const words = tagSplit[j].split(" ");

					for (let k = 0; k < words.length; k++) {
						const wordWidth = this.context.measureText(words[k]).width;

						if (this._style.breakWords && wordWidth > spaceLeft) {
							// Part should be split in the middle
							const characters = words[k].split('');

							if (k > 0) {
								result += " ";
								spaceLeft -= this.context.measureText(" ").width;
							}

							for (let c = 0; c < characters.length; c++) {
								const characterWidth = this.context.measureText(characters[c]).width;

								if (characterWidth > spaceLeft) {
									result += `\n${characters[c]}`;
									spaceLeft = wordWrapWidth - characterWidth;
								} else {
									result += characters[c];
									spaceLeft -= characterWidth;
								}
							}
						} else if(this._style.breakWords) {
							result += words[k];
							spaceLeft -= wordWidth;
						} else {
							const paddedWordWidth =
								wordWidth + (k > 0 ? this.context.measureText(" ").width : 0);

							if (paddedWordWidth > spaceLeft) {
								// Skip printing the newline if it's the first word of the line that is
								// greater than the word wrap width.
								if (!firstWordOfLine) {
									result += "\n";
								}

								result += words[k];
								spaceLeft = wordWrapWidth - wordWidth;
							} else {
								spaceLeft -= paddedWordWidth;

								if (k > 0) {
									result += " ";
								}

								result += words[k];
							}
						}
						firstWordOfLine = false;
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
