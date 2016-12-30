"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MultiStyleText = (function (_super) {
    __extends(MultiStyleText, _super);
    function MultiStyleText(text, styles) {
        var _this = _super.call(this, text) || this;
        _this.styles = styles;
        return _this;
    }
    Object.defineProperty(MultiStyleText.prototype, "styles", {
        set: function (styles) {
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
            for (var style in styles) {
                if (style === "default") {
                    this.assign(this.textStyles["default"], styles[style]);
                }
                else {
                    this.textStyles[style] = this.assign({}, styles[style]);
                }
            }
            this._style = new PIXI.TextStyle(this.textStyles["default"]);
            this.dirty = true;
        },
        enumerable: true,
        configurable: true
    });
    MultiStyleText.prototype._getTextDataPerLine = function (lines) {
        var outputTextData = [];
        var tags = Object.keys(this.textStyles).join("|");
        var re = new RegExp("</?(\"" + tags + ")>", "g");
        var styleStack = [this.assign({}, this.textStyles["default"])];
        for (var i = 0; i < lines.length; i++) {
            var lineTextData = [];
            var matches = [];
            var matchArray = void 0;
            while (matchArray = re.exec(lines[i])) {
                matches.push(matchArray);
            }
            if (matches.length === 0) {
                lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1]));
            }
            else {
                var currentSearchIdx = 0;
                for (var j = 0; j < matches.length; j++) {
                    if (matches[j].index > currentSearchIdx) {
                        lineTextData.push(this.createTextData(lines[i].substring(currentSearchIdx, matches[j].index), styleStack[styleStack.length - 1]));
                    }
                    if (matches[j][0][1] === "/") {
                        if (styleStack.length > 1) {
                            styleStack.pop();
                        }
                    }
                    else {
                        styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));
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
    };
    MultiStyleText.prototype.createTextData = function (text, style) {
        return {
            text: text,
            style: style,
            width: 0,
            height: 0,
            fontProperties: undefined
        };
    };
    MultiStyleText.prototype.updateText = function () {
        if (!this.dirty) {
            return;
        }
        this.texture.baseTexture.resolution = this.resolution;
        var textStyles = this.textStyles;
        var outputText = this.text;
        if (this._style.wordWrap) {
            outputText = this.wordWrap(this.text);
        }
        var lines = outputText.split(/(?:\r\n|\r|\n)/);
        var outputTextData = this._getTextDataPerLine(lines);
        var lineWidths = [];
        var lineHeights = [];
        var maxLineWidth = 0;
        for (var i = 0; i < lines.length; i++) {
            var lineWidth = 0;
            var lineHeight = 0;
            for (var j = 0; j < outputTextData[i].length; j++) {
                var sty = outputTextData[i][j].style;
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
        var stylesArray = Object.keys(textStyles).map(function (key) { return textStyles[key]; });
        var maxStrokeThickness = stylesArray.reduce(function (prev, curr) { return Math.max(prev, curr.strokeThickness || 0); }, 0);
        var maxDropShadowDistance = stylesArray.reduce(function (prev, curr) { return Math.max(prev, curr.dropShadow ? (curr.dropShadowDistance || 0) : 0); }, 0);
        var maxLineHeight = lineHeights.reduce(function (prev, curr) { return Math.max(prev, curr); }, 0);
        var width = maxLineWidth + maxStrokeThickness + maxDropShadowDistance;
        var height = (maxLineHeight * lines.length) + maxDropShadowDistance;
        this.canvas.width = (width + this.context.lineWidth) * this.resolution;
        this.canvas.height = height * this.resolution;
        this.context.scale(this.resolution, this.resolution);
        this.context.textBaseline = "alphabetic";
        this.context.lineJoin = "round";
        for (var i = 0; i < outputTextData.length; i++) {
            var line = outputTextData[i];
            var linePositionX = 0;
            for (var j = 0; j < line.length; j++) {
                var textStyle = line[j].style;
                var text = line[j].text;
                var fontProperties = line[j].fontProperties;
                this.context.font = PIXI.Text.getFontStyle(textStyle);
                var strokeStyle = textStyle.stroke;
                if (typeof strokeStyle === "number") {
                    strokeStyle = PIXI.utils.hex2string(strokeStyle);
                }
                this.context.strokeStyle = strokeStyle;
                this.context.lineWidth = textStyle.strokeThickness;
                linePositionX += maxStrokeThickness / 2;
                var linePositionY = (maxStrokeThickness / 2 + i * lineHeights[i]) + fontProperties.ascent;
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
                    var dropFillStyle = textStyle.dropShadowColor;
                    if (typeof dropFillStyle === "number") {
                        dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
                    }
                    this.context.fillStyle = dropFillStyle;
                    var xShadowOffset = Math.sin(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;
                    var yShadowOffset = Math.cos(textStyle.dropShadowAngle) * textStyle.dropShadowDistance;
                    if (textStyle.fill) {
                        this.context.fillText(text, linePositionX + xShadowOffset, linePositionY + yShadowOffset);
                    }
                }
                var fillStyle = textStyle.fill;
                if (typeof fillStyle === "number") {
                    fillStyle = PIXI.utils.hex2string(fillStyle);
                }
                else if (Array.isArray(fillStyle)) {
                    for (var i_1 = 0; i_1 < fillStyle.length; i_1++) {
                        var fill = fillStyle[i_1];
                        if (typeof fill === "number") {
                            fillStyle[i_1] = PIXI.utils.hex2string(fill);
                        }
                    }
                }
                this.context.fillStyle = this._generateFillStyle(new PIXI.TextStyle(textStyle), [text]);
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
    };
    MultiStyleText.prototype.assign = function (destination) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        for (var _a = 0, sources_1 = sources; _a < sources_1.length; _a++) {
            var source = sources_1[_a];
            for (var key in source) {
                destination[key] = source[key];
            }
        }
        return destination;
    };
    return MultiStyleText;
}(PIXI.Text));
//# sourceMappingURL=pixi-multistyle-text.js.map