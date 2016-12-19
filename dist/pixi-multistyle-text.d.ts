/// <reference types="pixi.js" />
export interface ExtendedTextStyle extends PIXI.TextStyle {
    valign?: "top" | "middle" | "bottom";
}
export interface TextStyleSet {
    [key: string]: ExtendedTextStyle;
}
export declare class MultiStyleText extends PIXI.Text {
    private _alignment;
    private textStyles;
    constructor(text: string, styles: TextStyleSet);
    style: TextStyleSet;
    alignment: "left" | "right" | "center";
    readonly blockStyle: "left" | "right" | "center";
    private _getTextDataPerLine(lines);
    private createTextData(text, style);
    updateText(): void;
}
