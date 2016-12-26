/// <reference path="../node_modules/pixi-typescript/pixi.js.d.ts" />
interface ExtendedTextStyle extends PIXI.ITextStyleStyle {
    valign?: "top" | "middle" | "bottom";
}
interface TextStyleSet {
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
declare function assign(destination: any, ...sources: any[]): any;
declare class MultiStyleText extends PIXI.Text {
    private textStyles;
    constructor(text: string, styles: TextStyleSet);
    styles: TextStyleSet;
    private _getTextDataPerLine(lines);
    private createTextData(text, style);
    updateText(): void;
}
