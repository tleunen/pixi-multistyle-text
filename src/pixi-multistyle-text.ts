import * as PIXI from "pixi.js";

"use strict";

const majorVersion = parseInt(PIXI.VERSION.split(".")[0], 10);
if (majorVersion< 5) {
  throw new Error(`Detected Pixi.js version ${PIXI.VERSION}. pixi-multistyle-text supports Pixi.js version 5+. (Please use v0.8.0 for Pixi 4 support.)`);
}


export interface TagData {
  name: string;
  properties: { [key: string]: string };
}

export interface HitboxData {
  tag: TagData;
  hitbox: PIXI.Rectangle;
}

export type TagStyle = "bbcode" | "xml";
export type VAlign = "top" | "middle" | "bottom" | "baseline" | number;

interface TextStyle {
  align?: string;
  breakWords?: boolean;
  dropShadow?: boolean;
  dropShadowAlpha?: number;
  dropShadowAngle?: number;
  dropShadowBlur?: number;
  dropShadowColor?: string | number;
  dropShadowDistance?: number;
  fill?: string | string[] | number | number[] | CanvasGradient | CanvasPattern;
  fillGradientType?: number;
  fillGradientStops?: number[];
  fontFamily?: string | string[];
  fontSize?: number | string;
  fontStyle?: string;
  fontVariant?: string;
  fontWeight?: string;
  leading?: number;
  letterSpacing?: number;
  lineHeight?: number;
  lineJoin?: string;
  miterLimit?: number;
  padding?: number;
  stroke?: string | number;
  strokeThickness?: number;
  trim?: boolean;
  textBaseline?: string;
  whiteSpace?: string;
  wordWrap?: boolean;
  wordWrapWidth?: number;
}

export interface TextStyleExtended extends TextStyle {
  valign?: VAlign;
  debug?: boolean;
  tagStyle?: TagStyle;
}

export interface TextStyleExtendedWithDefault extends TextStyleExtended {
  dropShadowAlpha?: number;
  fillGradientStops?: number[];
  leading?: number;
  trim?: boolean;
  whiteSpace?: string;

  align: string;
  breakWords: boolean;
  dropShadow: boolean;
  dropShadowAngle: number;
  dropShadowBlur: number;
  dropShadowColor: string | number;
  dropShadowDistance: number;
  fill: string | string[] | number | number[] | CanvasGradient | CanvasPattern;
  fillGradientType: number;
  fontFamily: string | string[];
  fontSize: number | string;
  fontStyle: string;
  fontVariant: string;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  lineJoin: string;
  miterLimit: number;
  padding: number;
  stroke: string | number;
  strokeThickness: number;
  textBaseline: string;
  wordWrap: boolean;
  wordWrapWidth: number;

  valign: VAlign;
  debug: boolean;
  tagStyle: TagStyle;
}

export type TextStyleSet = {
  default:TextStyleExtendedWithDefault
} & {
  [key: string]: TextStyleExtended;
};

interface FontProperties {
  ascent: number;
  descent: number;
  fontSize: number;
}

interface TextData {
  text: string;
  style: TextStyleExtended;
  width: number;
  height: number;
  fontProperties: FontProperties;
  tag: TagData;
}

interface TextDrawingData {
  text: string;
  style: TextStyleExtended;
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

export interface MstInteractionEvent extends PIXI.interaction.InteractionEvent {
  targetTag: TagData | undefined;
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

const TAG_STYLE = {
  bbcode: "bbcode",
  xml: "xml"
};

const TAG = {
  bbcode: ["[", "]"],
  xml: ["<", ">"]
};

interface TextWithPrivateMembers extends PIXI.Text {
  dirty: boolean;
  _texture: PIXI.Texture;
  _style: PIXI.TextStyle;
  _onTextureUpdate(): void;
  _generateFillStyle(style: object, lines: string[]): string | number | CanvasGradient;
}

export default class MultiStyleText extends PIXI.Text {
  private static DEFAULT_TAG_STYLE: TextStyleExtendedWithDefault = {
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
    wordWrapWidth: 100,

    tagStyle: "xml",
    debug:false,
    valign: "baseline",
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

  private _textStyles!: TextStyleSet;

  public get textStyles () { return this._textStyles; }

  public set textStyles(styles: TextStyleSet) {
    throw new Error("Don't set textStyles directly. Use setStyles()");
  }

  public get defaultTextStyle () { return this.textStyles.default; }
  public set defaultTextStyle (style) { this.textStyles.default = style; }

  public setStyles(styles:TextStyleSet):void {
    this.resetTextStyles();

    for (let styleName in styles) {
      if (styleName === "default") {
        this._textStyles.default = {...this._textStyles.default, ...styles.default};
      } else {
        this._textStyles[styleName] = { ...styles[styleName] };
      }
    }
    if (this._textStyles.default.tagStyle === TAG_STYLE.bbcode) {
      // when using bbcode parsing, register a bunch of standard bbcode tags and some cool pixi ones
      this._textStyles.b = {fontStyle: 'bold'};
      this._textStyles.i = {fontStyle: 'italic'};
      this._textStyles.color = {fill: ''}; // an array would result in gradiens
      this._textStyles.outline = {stroke: '', strokeThickness: 6};
      this._textStyles.font = {fontFamily: ''};
      this._textStyles.shadow ={ dropShadowColor: '', dropShadow: true, dropShadowBlur: 3, dropShadowDistance: 3, dropShadowAngle: 2};
      this._textStyles.size = {fontSize: 'px'};
      this._textStyles.spacing = {letterSpacing: 0};
      this._textStyles.align = {align: ''};
    }

    this.withPrivateMembers()._style = new PIXI.TextStyle(this._textStyles.default);
    this.withPrivateMembers().dirty = true;
  }

  private resetTextStyles() {
    this._textStyles = { default : {...MultiStyleText.DEFAULT_TAG_STYLE} };
  }

  private hitboxes: HitboxData[] = [];

  constructor(text: string, styles: TextStyleSet) {
    super(text);

    this.setStyles(styles);

    const migrateEvent = (e: PIXI.interaction.InteractionEvent) => this.handleInteraction(e);

    INTERACTION_EVENTS.forEach((event) => {
      this.on(event, migrateEvent);
    });
  }

  private handleInteraction(e: PIXI.interaction.InteractionEvent) {
    let ev = e as MstInteractionEvent;

    let localPoint = e.data.getLocalPosition(this);
    let targetTag = this.hitboxes.reduce(
      (prev:HitboxData | undefined, hitbox:HitboxData) => {
        if (prev !== undefined) {
          return  prev
        }
        if (hitbox.hitbox.contains(localPoint.x, localPoint.y)) {
          return hitbox;
        }
        return undefined;
      }, undefined
    );
    ev.targetTag = targetTag === undefined ? undefined : targetTag.tag;
  }

  public setTagStyle(tag: string, style: TextStyleExtended): void {
    if (tag in this.textStyles) {
      this.textStyles[tag] = {...this.textStyles[tag], ...style};
    } else {
      this.textStyles[tag] = {...style };
    }

    this.withPrivateMembers()._style = new PIXI.TextStyle(this.defaultTextStyle);
    this.withPrivateMembers().dirty = true;
  }

  public deleteTagStyle(tag: string): void {
    if (tag === "default") {
      this.defaultTextStyle = {...MultiStyleText.DEFAULT_TAG_STYLE};
    } else {
      delete this.textStyles[tag];
    }

    this.withPrivateMembers()._style = new PIXI.TextStyle(this.defaultTextStyle);
    this.withPrivateMembers().dirty = true;
  }

  private getTagRegex(captureName: boolean, captureMatch: boolean): RegExp {
    let tagAlternation = Object.keys(this.textStyles).join("|");
    const { tagStyle } = this.defaultTextStyle;

    if (captureName) {
      tagAlternation = `(${tagAlternation})`;
    } else {
      tagAlternation = `(?:${tagAlternation})`;
    }

    let pattern;
    if (tagStyle === TAG_STYLE.bbcode) {
      const [openTag, closeTag] = TAG.bbcode;
      pattern = `\\${openTag}${tagAlternation}(?:\\=(?:[A-Za-z0-9_\\-\\#]+|'(?:[^']+|\\\\')*'))*\\s*\\${closeTag}|\\${openTag}\\/${tagAlternation}\\s*\\${closeTag}`;
    }  else {
      const [openTag, closeTag] = TAG.xml;
      pattern = `\\${openTag}${tagAlternation}(?:\\s+[A-Za-z0-9_\\-]+=(?:"(?:[^"]+|\\\\")*"|'(?:[^']+|\\\\')*'))*\\s*\\${closeTag}|\\${openTag}\\/${tagAlternation}\\s*\\${closeTag}`;
    }


    if (captureMatch) {
      pattern = `(${pattern})`;
    }

    return new RegExp(pattern, "g");
  }

  private getPropertyRegex(): RegExp {
    return new RegExp(`([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`, "g");
  }

  private getBBcodePropertyRegex(): RegExp {
    return new RegExp(`[A-Za-z0-9_\\-]+=([A-Za-z0-9_\\-\\#]+)`, "g");
  }

  private _getTextDataPerLine (lines: string[]) {
    let outputTextData: TextData[][] = [];
    let re = this.getTagRegex(true, false);

    let styleStack = [{...this.defaultTextStyle}];
    let tagStack: TagData[] = [{ name: "default", properties: {} }];

    // determine the group of word for each line
    for (let i = 0; i < lines.length; i++) {
      let lineTextData: TextData[] = [];

      // find tags inside the string
      let matches: RegExpExecArray[] = [];
      let matchArray: RegExpExecArray | null;

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
            let properties: { [key: string]: string } = {};
            let propertyRegex = this.getPropertyRegex();
            let propertyMatch: RegExpMatchArray | null;

            while (propertyMatch = propertyRegex.exec(matches[j][0])) {
              properties[propertyMatch[1]] = propertyMatch[2] || propertyMatch[3];
            }

            tagStack.push({ name: matches[j][1], properties });

            const { tagStyle } = this.defaultTextStyle;
            // if using bbtag style, take styling information in a different way
            if (tagStyle === TAG_STYLE.bbcode && matches[j][0].includes('=') && this.textStyles[matches[j][1]]) {
              const bbcodeRegex = this.getBBcodePropertyRegex();
              const bbcodeTags = bbcodeRegex.exec(matches[j][0]);
              let bbStyle:{ [key: string]: string } = {};

              const textStylesAsArray = Object.entries(this.textStyles[matches[j][1]]);
              textStylesAsArray.forEach( ([styleName, styleRules]) => {
                if (typeof styleRules === 'string' && bbcodeTags !== null) {
                  bbStyle[styleName] = bbcodeTags[1] + styleRules;
                } else {
                  bbStyle[styleName] = styleRules;
                }
              });

              styleStack.push({...styleStack[styleStack.length - 1], ...bbStyle });

            } else {
              styleStack.push({...styleStack[styleStack.length - 1], ...this.textStyles[matches[j][1]] });
            }
          }

          // update the current search index
          currentSearchIdx = matches[j].index + matches[j][0].length;
        }

        // is there any character left?
        if (currentSearchIdx < lines[i].length) {
          const result = this.createTextData(
            currentSearchIdx ? lines[i].substring(currentSearchIdx) : lines[i],
            styleStack[styleStack.length - 1],
            tagStack[tagStack.length - 1]
          )
          lineTextData.push(result);
        }
      }

      outputTextData.push(lineTextData);
    }

    // don't display any incomplete tags at the end of text- good for scrolling text in games
    const { tagStyle } = this.defaultTextStyle;
    outputTextData[outputTextData.length-1].map( data => {
      if (data.text.includes(TAG[tagStyle][0])) {
        let pattern;
        if (tagStyle === TAG_STYLE.bbcode) {
          pattern = /^(.*)\[/;
        } else {
          pattern = /^(.*)\</;
        }
        const matches = data.text.match(pattern);
        if (matches) {
          data.text = matches[1];
        }
      }
    });

    return outputTextData;
  }

  private getFontString(style: TextStyleExtended): string {
    return new PIXI.TextStyle(style).toFontString();
  }

  private createTextData(text: string, style: TextStyleExtended, tag: TagData): TextData {
    return {
      text,
      style,
      width: 0,
      height: 0,
      fontProperties: {ascent: 0, descent: 0, fontSize: 0},
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

  private withPrivateMembers(): TextWithPrivateMembers {
    return ((this as unknown) as TextWithPrivateMembers);
  }

  public updateText(): void {
    if (!this.withPrivateMembers().dirty) {
      return;
    }

    this.hitboxes = [];

    this.texture.baseTexture.resolution = this.resolution;
    let textStyles = this.textStyles;
    let outputText = this.text;

    if(this.withPrivateMembers()._style.wordWrap) {
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
    let maxLineWidth = 0;

    for (let i = 0; i < lines.length; i++) {
      let lineWidth = 0;
      let lineYMin = 0;
      let lineYMax = 0;

      for (let j = 0; j < outputTextData[i].length; j++) {
        let sty = outputTextData[i][j].style;
        const ls = sty.letterSpacing || 0;

        this.context.font = this.getFontString(sty);

        // save the width
        outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;

        if (outputTextData[i][j].text.length !== 0) {
          outputTextData[i][j].width += (outputTextData[i][j].text.length - 1) * ls;

          if (j > 0) {
            lineWidth += ls / 2; // spacing before first character
          }

          if (j < outputTextData[i].length - 1) {
            lineWidth += ls / 2; // spacing after last character
          }
        }

        lineWidth += outputTextData[i][j].width;

        // save the font properties
        outputTextData[i][j].fontProperties = PIXI.TextMetrics.measureFont(this.context.font);

        // save the height
        outputTextData[i][j].height = outputTextData[i][j].fontProperties.fontSize;

        if (typeof sty.valign === "number") {
          lineYMin =
            Math.min(
              lineYMin,
              sty.valign
                - outputTextData[i][j].fontProperties.descent);
          lineYMax =
            Math.max(
              lineYMax,
              sty.valign
                + outputTextData[i][j].fontProperties.ascent);
        } else {
          lineYMin =
            Math.min(
              lineYMin,
              -outputTextData[i][j].fontProperties.descent);
          lineYMax =
            Math.max(
              lineYMax,
              outputTextData[i][j].fontProperties.ascent);
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
    let width = maxLineWidth + 2 * maxStrokeThickness + 2 * dropShadowPadding;
    let height = totalHeight + 2 * maxStrokeThickness + 2 * dropShadowPadding;

    this.canvas.width = width * this.resolution;
    this.canvas.height = height * this.resolution;

    this.context.scale(this.resolution, this.resolution);

    this.context.textBaseline = "alphabetic";
    this.context.lineJoin = "round";

    let basePositionY = dropShadowPadding + maxStrokeThickness;

    let drawingData: TextDrawingData[] = [];

    // Compute the drawing data
    for (let i = 0; i < outputTextData.length; i++) {
      let line = outputTextData[i];
      let linePositionX: number;

      switch (this.withPrivateMembers()._style.align) {

        case "center":
          linePositionX = dropShadowPadding + maxStrokeThickness + (maxLineWidth - lineWidths[i]) / 2;
          break;
        case "right":
          linePositionX = dropShadowPadding + maxStrokeThickness + maxLineWidth - lineWidths[i];
          break;
        case "left":
        default:
          linePositionX = dropShadowPadding + maxStrokeThickness;
          break;
      }

      for (let j = 0; j < line.length; j++) {
        let { style, text, fontProperties, width, height, tag } = line[j];
        const ls = style.letterSpacing || 0;

        let linePositionY = basePositionY + fontProperties.ascent;

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
            linePositionY += lineYMaxs[i] - fontProperties.ascent - (style.valign || 0);
            break;
        }

        if (ls === 0) {
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
              linePositionX += ls / 2;
            }

            let charWidth = this.context.measureText(text.charAt(k)).width;

            drawingData.push({
              text: text.charAt(k),
              style,
              x: linePositionX,
              y: linePositionY,
              width: charWidth,
              ascent: fontProperties.ascent,
              descent: fontProperties.descent,
              tag
            });

            linePositionX += charWidth;

            if (k < text.length - 1 || j < line.length - 1) {
              linePositionX += ls / 2;
            }
          }
        }
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

      let dropFillStyle = style.dropShadowColor || 0;
      if (typeof dropFillStyle === "number") {
        dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
      }
      const blur = style.dropShadowBlur || 0;
      const angle = style.dropShadowAngle || 0;
      const distance = style.dropShadowDistance || 0;
      this.context.shadowColor = dropFillStyle;
      this.context.shadowBlur = blur;
      this.context.shadowOffsetX = Math.cos(angle) * distance * this.resolution;
      this.context.shadowOffsetY = Math.sin(angle) * distance * this.resolution;

      this.context.fillText(text, x, y);
    });

    this.context.restore();

    // Second pass: draw the strokes only
    drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
      if (style.stroke === undefined || !style.strokeThickness) {
        return; // Skip this step if we have no stroke
      }

      this.context.font = this.getFontString(style);

      let strokeStyle = style.stroke;
      if (typeof strokeStyle === "number") {
        strokeStyle = PIXI.utils.hex2string(strokeStyle);
      }

      this.context.strokeStyle = strokeStyle;
      this.context.lineWidth = style.strokeThickness;

      this.context.strokeText(text, x, y);
    });

    // Third pass: draw the fills only
    drawingData.forEach(({ style, text, x, y, width, ascent, descent, tag }) => {
      if (style.fill === undefined) {
        return; // Skip this step if we have no fill
      }

      this.context.font = this.getFontString(style);

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
      this.context.fillStyle = ((this as unknown) as TextWithPrivateMembers)._generateFillStyle(new PIXI.TextStyle(style), [text]) as string | CanvasGradient;
      // Typecast required for proper typechecking

      this.context.fillText(text, x, y);
    });

    // Fourth pass: collect the bounding boxes and draw the debug information
    drawingData.forEach(({ style, x, y, width, ascent, descent, tag }) => {
      let offset = -this.withPrivateMembers()._style.padding - this.getDropShadowPadding();

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
    const wordWrapWidth = this.withPrivateMembers()._style.wordWrapWidth;
    let styleStack = [{...this.defaultTextStyle}];
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
            styleStack.push({...styleStack[styleStack.length - 1], ...this.textStyles[tagSplit[j]]});
            j++;
          }
          this.context.font = this.getFontString(styleStack[styleStack.length - 1]);
        } else {
          const words = tagSplit[j].split(" ");

          for (let k = 0; k < words.length; k++) {
            const wordWidth = this.context.measureText(words[k]).width;

            if (this.withPrivateMembers()._style.breakWords && wordWidth > spaceLeft) {
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
            } else if(this.withPrivateMembers()._style.breakWords) {
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
    const texture = this.withPrivateMembers()._texture;

    let dropShadowPadding = this.getDropShadowPadding();

    texture.baseTexture.setRealSize(this.canvas.width, this.canvas.height, this.resolution);
    texture.trim.width = texture.frame.width = this.canvas.width / this.resolution;
    texture.trim.height = texture.frame.height = this.canvas.height / this.resolution;

    texture.trim.x = -this.withPrivateMembers()._style.padding - dropShadowPadding;
    texture.trim.y = -this.withPrivateMembers()._style.padding - dropShadowPadding;

    texture.orig.width = texture.frame.width - (this.withPrivateMembers()._style.padding + dropShadowPadding) * 2;
    texture.orig.height = texture.frame.height - (this.withPrivateMembers()._style.padding + dropShadowPadding) * 2;

    // call sprite onTextureUpdate to update scale if _width or _height were set
    this.withPrivateMembers()._onTextureUpdate();

    texture.baseTexture.emit('update', texture.baseTexture);

    this.withPrivateMembers().dirty = false;
  }
}
