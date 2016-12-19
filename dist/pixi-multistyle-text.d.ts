/// <reference types="pixi.js" />
export interface ExtendedTextStyle extends PIXI.TextStyle {
    valign?: "top" | "middle" | "bottom";
}
export interface TextStyleSet {
    [key: string]: ExtendedTextStyle;
}
export declare class MultiStyleText extends PIXI.Text {
    private textStyles;
    constructor(text: string, styles: TextStyleSet);
    style: TextStyleSet;
    private _getTextDataPerLine(lines);
    private createTextData(text, style);
    updateText(): void;
}
