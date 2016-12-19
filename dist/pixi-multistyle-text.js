"use strict";
class MultiStyleText extends PIXI.Text {
    constructor(text, styles) {
        super(text);
        this.style = styles;
    }
    set style(styles) {
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
            wordWrapWidth: 100,
        };
        for (let style in styles) {
            if (typeof styles[style].dropShadowColor === "number") {
                styles[style].dropShadowColor = PIXI.utils.hex2string(styles[style].dropShadowColor);
            }
            if (typeof styles[style].fill === "number") {
                styles[style].fill = PIXI.utils.hex2string(styles[style].fill);
            }
            if (typeof styles[style].stroke === "number") {
                styles[style].stroke = PIXI.utils.hex2string(styles[style].stroke);
            }
            if (style === "default") {
                Object.assign(this.textStyles["default"], styles[style]);
            }
            else {
                this.textStyles[style] = Object.assign({}, styles[style]);
            }
        }
        this.dirty = true;
        this._style = this.textStyles["default"];
    }
    _getTextDataPerLine(lines) {
        let outputTextData = [];
        let tags = Object.keys(this.textStyles).join("|");
        let re = new RegExp(`<\/?("${tags})>`, "g");
        let styleStack = [Object.assign({}, this.textStyles["default"])];
        for (let i = 0; i < lines.length; i++) {
            let lineTextData = [];
            let matches = [];
            let matchArray;
            while (matchArray = re.exec(lines[i])) {
                matches.push(matchArray);
            }
            if (matches.length === 0) {
                lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1]));
            }
            else {
                let currentSearchIdx = 0;
                for (let j = 0; j < matches.length; j++) {
                    if (matches[j].index > currentSearchIdx) {
                        lineTextData.push(this.createTextData(lines[i].substring(currentSearchIdx, matches[j].index), styleStack[styleStack.length - 1]));
                    }
                    if (matches[j][0][1] === "/") {
                        if (styleStack.length > 1) {
                            styleStack.pop();
                        }
                    }
                    else {
                        styleStack.push(Object.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));
                    }
                    currentSearchIdx = matches[j].index + matches[j][0].length;
                }
                if (currentSearchIdx < lines[i].length) {
                    lineTextData.push(this.createTextData(lines[i].substring(currentSearchIdx), styleStack[styleStack.length - 1]));
                }
            }
            outputTextData.push(lineTextData);
        }
        return outputTextData;
    }
    createTextData(text, style) {
        return {
            text,
            style,
            width: 0,
            height: 0,
            fontProperties: undefined
        };
    }
    updateText() {
        if (!this.dirty) {
            return;
        }
        this.texture.baseTexture.resolution = this.resolution;
        let textStyles = this.textStyles;
        let lines = this.text.split(/(?:\r\n|\r|\n)/);
        let outputTextData = this._getTextDataPerLine(lines);
        let lineWidths = [];
        let lineHeights = [];
        let maxLineWidth = 0;
        for (let i = 0; i < lines.length; i++) {
            let lineWidth = 0;
            let lineHeight = 0;
            for (let j = 0; j < outputTextData[i].length; j++) {
                let sty = outputTextData[i][j].style;
                this.context.font = PIXI.Text.getFontStyle(outputTextData[i][j].style);
                outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;
                lineWidth += outputTextData[i][j].width;
                outputTextData[i][j].fontProperties = PIXI.Text.calculateFontProperties(this.context.font);
                outputTextData[i][j].height =
                    outputTextData[i][j].fontProperties.fontSize + outputTextData[i][j].style.strokeThickness;
                lineHeight = Math.max(lineHeight, outputTextData[i][j].height);
            }
            lineWidths[i] = lineWidth;
            lineHeights[i] = lineHeight;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        }
        let stylesArray = Object.keys(textStyles).map((key) => textStyles[key]);
        let maxStrokeThickness = stylesArray.reduce((prev, curr) => Math.max(prev, curr.strokeThickness || 0), 0);
        let maxDropShadowDistance = stylesArray.reduce((prev, curr) => Math.max(prev, curr.dropShadow ? (curr.dropShadowDistance || 0) : 0), 0);
        let maxLineHeight = lineHeights.reduce((prev, curr) => Math.max(prev, curr), 0);
        let width = maxLineWidth + maxStrokeThickness + maxDropShadowDistance;
        let height = (maxLineHeight * lines.length) + maxDropShadowDistance;
        this.canvas.width = (width + this.context.lineWidth) * this.resolution;
        this.canvas.height = height * this.resolution;
        this.context.scale(this.resolution, this.resolution);
        this.context.textBaseline = "alphabetic";
        this.context.lineJoin = "round";
        for (let i = 0; i < outputTextData.length; i++) {
            let line = outputTextData[i];
            let linePositionX = 0;
            for (let j = 0; j < line.length; j++) {
                let textStyle = line[j].style;
                let text = line[j].text;
                let fontProperties = line[j].fontProperties;
                this.context.font = PIXI.Text.getFontStyle(textStyle);
                this.context.strokeStyle = textStyle.stroke;
                this.context.lineWidth = textStyle.strokeThickness;
                linePositionX += maxStrokeThickness / 2;
                let linePositionY = (maxStrokeThickness / 2 + i * lineHeights[i]) + fontProperties.ascent;
                if (this._style.align === "right") {
                    linePositionX += maxLineWidth - lineWidths[i];
                }
                else if (this._style.align === "center" && linePositionX === 0) {
                    linePositionX += (maxLineWidth - lineWidths[i]) / 2;
                }
                if (textStyle.valign === "bottom") {
                    linePositionY += lineHeights[i] - line[j].height -
                        (maxStrokeThickness - textStyle.strokeThickness) / 2;
                }
                else if (textStyle.valign === "middle") {
                    linePositionY += (lineHeights[i] - line[j].height) / 2 -
                        (maxStrokeThickness - textStyle.strokeThickness) / 2;
                }
                if (textStyle.dropShadow) {
                    this.context.fillStyle = textStyle.dropShadowColor;
                    let xShadowOffset = Math.sin(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;
                    let yShadowOffset = Math.cos(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;
                    if (textStyle.fill) {
                        this.context.fillText(text, linePositionX + xShadowOffset, linePositionY + yShadowOffset);
                    }
                }
                this.context.fillStyle = textStyle.fill;
                if (textStyle.stroke && textStyle.strokeThickness) {
                    this.context.strokeText(text, linePositionX, linePositionY);
                }
                if (textStyle.fill) {
                    this.context.fillText(text, linePositionX, linePositionY);
                }
                linePositionX += line[j].width;
                linePositionX -= maxStrokeThickness / 2;
            }
        }
        this.updateTexture();
    }
}
exports.MultiStyleText = MultiStyleText;
//# sourceMappingURL=pixi-multistyle-text.js.map