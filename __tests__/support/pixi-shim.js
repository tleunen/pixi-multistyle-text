document.body.innerHTML = "<div id='root'></div>";

global.window = document.defaultView;
global.window.document = global.document;

global.Canvas = require('canvas');
global.Image = require('canvas').Image;

global.Image.prototype.addEventListener = function(event, fn) {
    const img = this;

    switch (event) {
        case 'error':
            img.onerror = function() {
                img.onerror = null;
                img.onload = null;
                fn.call(img);
            };
            break;

        case 'load':
            img.onload = function() {
                img.onerror = null;
                img.onload = null;
                fn.call(img);
            };
            break;
    }
};

global.Image.prototype.removeEventListener = function() {};
global.navigator = { userAgent: 'node.js' }; // could be anything
global.PIXI = require("pixi.js");