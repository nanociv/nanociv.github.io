window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame;
})();

(function() {

var PIXEL_DENSITY = 2;

var MAX_WIDTH = 2048;
var MAX_HEIGHT = 2048;

var MAP_WIDTH = 80;
var MAP_HEIGHT = 50;

var DEFAULT_TILE_WIDTH = 20.0;
var DEFAULT_TILE_HEIGHT = 0.866 * DEFAULT_TILE_WIDTH;

var TILE_WATER = 0;
var TILE_LAND = 1;
var MAX_PLAYERS = 5;

var UNIT_TYPE_CITY = 0;
var UNIT_TYPE_SETTLER = 1;
var UNIT_TYPE_WARRIOR = 2;

var COLORS = [
    ['#ccedff', '', ''], // water
    ['#EFEBE9', '#D7CCC8', '#D7CCC8'], // land
    ['#BBDEFB', '#90CAF9', '#1976D2'], // blue
    ['#FFCDD2', '#EF9A9A', '#D32F2F'], // red
    ['#C8E6C9', '#A5D6A7', '#388E3C'], // green
    ['#FFE0B2', '#FFCC80', '#F57C00'], // orange
    ['#E1BEE7', '#CE93D8', '#7B1FA2'], // purple
];

var UNIT_NAMES = [
    'City',
    'Settler',
    'Warrior'
]

var MAP_EARTH = [
'11111111111111111111111111111111111111111111111111111111111111111111111111111111',
'00111111111111111111111111111111111100000000000111111111111111111111111111100000',
'00111111111111111111111111111111111000000000000001111111111111111111111100000000',
'10111111111111111111111111111111110000000000000000011111111111111111111100000000',
'00011110000001110000111000011111100000000010000000001011111111111111111100000000',
'01111111111111111110011100011110000000001111110111111111111111111111111111111000',
'11111116661111111000001000011000000110011011111111111111111111111111111111111100',
'11111116661111110000100000000000000011011011111111111111111111111111111111001000',
'00000116661111110001111000000000001011001011111111111111111111111111111000001000',
'00000114445551111001111100000000001010000111111111111111111111111111111000001100',
'00000114445551111111111000000000000000111111111111111111111111111111111111000000',
'00000114445551101111100100000000000011111111111111111111111111111111111111000000',
'00000222223331101111100000000000001111111111100011001011111111111111111111000000',
'00002222223331111110000000000000001111001011100001001111111111111111111110000000',
'00002222223331111100000000000000001110011010011111101111111111111111110100000000',
'00001111111111111000000000000000000000000010000111111111111111111111111000001000',
'00001111111111110000000000000000000111110000000111111111111111111111111000000000',
'00000111111111100000000000000000001111111101111111111111111111111111111100000000',
'00000011110000100000000000000000011111111111111111100111111111111111111100000000',
'00000011110001000000000000000000011111111111111011110000111111111111111100000000',
'00000001100000000000000000000000111111111111111001111110011111111111110000000000',
'00000001110100000000000000000000111111111111111101111100011111001111000000000000',
'00000000011110000000000000000000111111111111111100111000001110000111100000000000',
'00000000000110000000000000000000111111111111111110000000001100000011100000000000',
'00000000000011001100000000000000111111111111111111110000000100000000100000000000',
'00000000000001111111100000000000011111111111111111110000000000000000000000000000',
'00000000000000011111110000000000001100011111111111110000000000000001000000000000',
'00000000000000011111111000000000000000001111111111100000000000000010001100000000',
'00000000000000111111111000000000000000001111111111000000000000000001001100000000',
'00000000000000111111111111100000000000001111111110000000000000000000100000001100',
'00000000000000111111111111110000000000000111111110000000000000000000000000000110',
'00000000000000011111111111110000000000000111111110000000000000000000000000000001',
'00000000000000011111111111100000000000000111111110000000000000000000000000000000',
'00000000000000001111111111100000000000000111111110010000000000000000000011100100',
'00000000000000000111111111100000000000000111111100110000000000000000000111111100',
'00000000000000000011111111100000000000000111111000110000000000000000011111111110',
'00000000000000000011111110000000000000000111111000100000000000000000111111111111',
'00000000000000000011111100000000000000000111111000000000000000000000111111111111',
'00000000000000000011111100000000000000000011110000000000000000000000111111111111',
'00000000000000000011111100000000000000000011100000000000000000000000111001111110',
'00000000000000000011111000000000000000000000000000000000000000000000000000111100',
'00000000000000000011110000000000000000000000000000000000000000000000000000010000',
'00000000000000000011100000000000000000000000000000000000000000000000000000000000',
'00000000000000000001100000000000000000000000000000000000000000000000000000000000',
'00000000000000000001100000000000000000000000000000000000000000000000000000000000',
'00000000000000000001110000000000000000000000000000000000000000000000000000000000',
'00000000000000000000010000000000000000000000000000000000000000000000000000000000',
'00000000000000000000000000000000000000000000000000000000000000000000000000000000',
'00000000000000000000000000000000000000000000000000000000000000000000000000000000',
'11111111111111111111111111111111111111111111111111111111111111111111111111111111'
];

var canvas = null;
var canvasCtx = null;
var buffer = null;
var bufferCtx = null;
var viewportWidth = 1;
var viewportHeight = 1;
var fps = 0;
var frame = 0;
var startTime = getTime();
var dragging = false;
var clickX = 0;
var clickY = 0;
var mouseDownTime = 0;
var zoomFactor = 2.0;
var viewportX = 200.0;
var viewportY = 200.0;
var dirty = true;
var map = null;
var pinchLength = 0;
var selectedUnit = null;
var units = [
    {'type': UNIT_TYPE_CITY,     'team': 4,  'x': 8, 'y': 7,   'level': 5},
    {'type': UNIT_TYPE_WARRIOR,  'team': 4,  'x': 9, 'y': 7,   'level': 1},
    {'type': UNIT_TYPE_CITY,     'team': 2,  'x': 8, 'y': 10,  'level': 5},
    {'type': UNIT_TYPE_WARRIOR,  'team': 2,  'x': 9, 'y': 10,  'level': 1},
    {'type': UNIT_TYPE_WARRIOR,  'team': 2,  'x': 0, 'y': 0,   'level': 1},
    {'type': UNIT_TYPE_WARRIOR,  'team': 2,  'x': 1, 'y': 0,   'level': 1},
    {'type': UNIT_TYPE_WARRIOR,  'team': 2,  'x': 0, 'y': 1,   'level': 1},
    {'type': UNIT_TYPE_WARRIOR,  'team': 2,  'x': 1, 'y': 1,   'level': 1},
];

function init() {
    map = new Array(MAP_HEIGHT);

    // Earth
    for (var y = 0; y < MAP_HEIGHT; y++) {
        map[y] = new Array(MAP_WIDTH);
        for (var x = 0; x < MAP_WIDTH; x++) {
            var value = parseInt(MAP_EARTH[y].charAt(x));
            var tileType = value === TILE_WATER ? TILE_WATER : TILE_LAND;
            var tileTeam = value > TILE_LAND ? value - TILE_LAND - 1 : -1;
            map[y][x] = {'value': value, 'type': tileType, 'team': tileTeam};
        }
    }

    for (var i = 0; i < units.length; i++) {
        var unit = units[i];
        map[unit.y][unit.x]['unit'] = unit;
    }

    canvas = document.querySelector('canvas');
    canvasCtx = canvas.getContext('2d');

    buffer = document.createElement('canvas');
    bufferCtx = buffer.getContext('2d');

    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mousemove', handleMouseMove, false);
    canvas.addEventListener('mouseup', handleMouseUp, false);

    canvas.addEventListener('touchstart', handleMouseDown, false);
    canvas.addEventListener('touchmove', handleMouseMove, false);
    canvas.addEventListener('touchend', handleMouseUp, false);

    canvas.addEventListener('mousewheel', handleMouseWheel, false);
    canvas.addEventListener('DOMMouseScroll', handleMouseWheel, false);

    window.addEventListener('resize', resize, false);

    resize();
    loop();
};

function resize() {
    viewportWidth = Math.max(1, Math.min(MAX_WIDTH, window.innerWidth));
    viewportHeight = Math.max(1, Math.min(MAX_HEIGHT, window.innerHeight));

    canvas.width = PIXEL_DENSITY * viewportWidth;
    canvas.height = PIXEL_DENSITY * viewportHeight;
    canvas.style.width = viewportWidth + 'px';
    canvas.style.height = viewportHeight + 'px';

    buffer.width = PIXEL_DENSITY * viewportWidth;
    buffer.height = PIXEL_DENSITY * viewportHeight;

    dirty = true;
}

function draw() {
    var ctx = bufferCtx;

    ctx.save();
    ctx.scale(PIXEL_DENSITY, PIXEL_DENSITY);
    drawOcean(ctx);
    drawLand(ctx);
    drawCulture(ctx);
    drawUnits(ctx);
    drawSelectedUnit(ctx);
    drawOverlays(ctx);
    ctx.restore();
    canvasCtx.drawImage(buffer, 0, 0);
}

function drawOcean(ctx) {
    ctx.fillStyle = COLORS[0][0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawLand(ctx) {
    drawTileEngine(ctx, 0);
}

function drawCulture(ctx) {
    drawTileEngine(ctx, 1);
}

function drawUnits(ctx) {
    drawTileEngine(ctx, 2);
}

function drawTileEngine(ctx, stage) {
    var tileWidth = zoomFactor * DEFAULT_TILE_WIDTH;
    var tileHeight = zoomFactor * DEFAULT_TILE_HEIGHT;

    var startX = Math.floor((viewportX - (0.5 * viewportWidth / zoomFactor)) / DEFAULT_TILE_WIDTH) - 2;
    var endX = Math.ceil((viewportX + (0.5 * viewportWidth / zoomFactor)) / DEFAULT_TILE_WIDTH);

    var startY = Math.max(0, Math.floor((viewportY - (0.5 * viewportHeight / zoomFactor)) / DEFAULT_TILE_HEIGHT) - 2);
    var endY = Math.min(MAP_HEIGHT, Math.ceil((viewportY + (0.5 * viewportHeight / zoomFactor)) / DEFAULT_TILE_HEIGHT));

    var lineWidth = Math.max(1, 0.5 * zoomFactor);
    ctx.lineWidth = lineWidth;

    for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
            var tx = tileWidth * x - viewportX * zoomFactor + 0.5 * viewportWidth;
            var ty = tileHeight * y - viewportY * zoomFactor + 0.5 * viewportHeight;

            if (y % 2 === 1) {
                tx += tileWidth / 2;
            }

            var tile = getTile(x, y);
            var fillColor = COLORS[tile.value][0];
            var borderColor = COLORS[tile.value][2];
            var unitColor = COLORS[tile.value][2];

            if (tile.type !== TILE_WATER && ((stage === 0 && tile.team === -1) || (stage === 1 && tile.team >= 0))) {
                //     x1   x2   x3
                // y1      /  \
                //       /      \
                // y2  |         |
                //     |         |
                // y3  |         |
                //       \      /
                // y4      \  /

                var drawX1 = tx;
                var drawX2 = tx + tileWidth / 2;
                var drawX3 = tx + tileWidth;

                var drawY1 = ty;
                var drawY2 = ty + tileHeight / 3;
                var drawY3 = ty + tileHeight;
                var drawY4 = ty + tileHeight * 4 / 3;

                ctx.fillStyle = fillColor;
                ctx.strokeStyle = borderColor;
                ctx.beginPath();
                ctx.moveTo(drawX1, drawY2);
                ctx.lineTo(drawX2, drawY1);
                ctx.lineTo(drawX3, drawY2);
                ctx.lineTo(drawX3, drawY3);
                ctx.lineTo(drawX2, drawY4);
                ctx.lineTo(drawX1, drawY3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            var unit = getUnit(x, y);
            if (stage === 2 && unit) {
                drawUnit(ctx, unit, tx, ty, tileWidth, tileHeight);
            }
        }
    }
}

function drawUnit(ctx, unit, tx, ty, tileWidth, tileHeight) {
    ctx.fillStyle = COLORS[2 + unit.team][2];

    if (unit.type === UNIT_TYPE_CITY) {
        drawCity(ctx, tx, ty, tileWidth, tileHeight);
    } else if (unit.type === UNIT_TYPE_SETTLER) {
        drawSettler(ctx, tx, ty, tileWidth, tileHeight);
    } else if (unit.type === UNIT_TYPE_WARRIOR) {
        drawWarrior(ctx, tx, ty, tileWidth, tileHeight);
    }

    var textX = tx + 0.50 * tileWidth;
    var textY = ty + 0.77 * tileHeight;
    var fontSize = Math.ceil(tileWidth / 4);
    if (fontSize >= 8) {
        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(unit.level.toFixed(), textX, textY);
    }
}

function drawCity(ctx, tx, ty, tileWidth, tileHeight) {
    // Draw a square for a city
    var centerX = tx + 0.5 * tileWidth;
    var centerY = ty + 0.667 * tileHeight;
    var radius = 0.275 * tileWidth;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
}

function drawSettler(ctx, tx, ty, tileWidth, tileHeight) {
    // Draw a triangle for a settler
    var centerX = tx + 0.5 * tileWidth;
    var centerY = ty + 0.7 * tileHeight;
    var radius = 0.325 * tileWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX + 0.866 * radius, centerY + 0.5 * radius);
    ctx.lineTo(centerX - 0.866 * radius, centerY + 0.5 * radius);
    ctx.closePath();
    ctx.fill();
}

function drawWarrior(ctx, tx, ty, tileWidth, tileHeight) {
    // Draw a circle for a warrior
    var centerX = tx + 0.5 * tileWidth;
    var centerY = ty + 0.667 * tileHeight;
    var radius = 0.275 * tileWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
}

function drawSelectedUnit(ctx) {
    if (!selectedUnit) {
        return;
    }

    var y = viewportHeight - 100;

    ctx.fillStyle = '#444';
    ctx.fillRect(0, y, viewportWidth, 100);

    drawUnit(ctx, selectedUnit, -10, y - 15, 100, 100);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(UNIT_NAMES[selectedUnit.type], 90, y + 30);
    ctx.fillText('Level: ' + selectedUnit.level, 90, y + 50);
    ctx.fillText('Strength: 100', 90, y + 70);
}

function drawOverlays(ctx) {
    ctx.fillStyle = '#444';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('FPS = ' + fps.toFixed(2), 10, 20);
    ctx.fillText('width = ' + canvas.width, 10, 40);
    ctx.fillText('height = ' + canvas.height, 10, 60);
    ctx.fillText('viewportX = ' + viewportX.toFixed(2), 10, 80);
    ctx.fillText('viewportY = ' + viewportY.toFixed(2), 10, 100);
}

function updateFps() {
    frame++;

    var currTime = getTime();
    var duration = currTime - startTime;
    fps = (frame / duration) * 1000.0;

    // Reset the FPS every one second
    if (duration > 1000) {
      startTime = getTime();
      frame = 0;
    }
}

function loop() {
    viewportX = normalizeCoordinate(viewportX);
    updateFps();

    if (dirty) {
        draw();
        dirty = false;
    }

    window.requestAnimFrame(loop);
}

function getTile(x, y) {
    if (y >= 0 && y < MAP_HEIGHT) {
        x = normalizeTile(x);
        return map[y][x];
    }
    return null;
}

function getTileAt(windowX, windowY) {
    var worldX = viewportX + (windowX - 0.5 * viewportWidth) / zoomFactor;
    var worldY = viewportY + (windowY - 0.5 * viewportHeight) / zoomFactor;

    var ty = Math.floor(worldY / DEFAULT_TILE_HEIGHT);
    var tx = ty % 2 === 0 ? Math.floor(worldX / DEFAULT_TILE_WIDTH) : Math.floor(worldX / DEFAULT_TILE_WIDTH - 0.5);

    return getTile(tx, ty);
}

function getUnit(x, y) {
    var tile = getTile(x, y);
    return tile && tile.unit;
}

function handleMouseDown(e) {
    e.preventDefault();

    if (e.touches && e.touches.length === 2) {
        handlePinchEvent(e);
        return;
    }

    fixTouchEvent(e);

    dragging = true;
    clickX = e.x;
    clickY = e.y;
    mouseDownTime = getTime();
}

function handleMouseMove(e) {
    e.preventDefault();

    if (e.touches && e.touches.length === 2) {
        handlePinchEvent(e);
        return;
    }

    fixTouchEvent(e);

    if (dragging) {
        viewportX += (clickX - e.x) / zoomFactor;
        viewportY += (clickY - e.y) / zoomFactor;
        clickX = e.x;
        clickY = e.y;
        dirty = true;
    }
}

function handleMouseUp(e) {
    e.preventDefault();
    fixTouchEvent(e);

    dragging = false;

    console.log('duration = ' + (getTime() - mouseDownTime));
    if (getTime() - mouseDownTime < 300) {
        handleClick(e);
    }
}

function handleClick(e) {
    var tile = getTileAt(clickX, clickY);
    selectedUnit = tile && tile.unit;
    dirty = true;
}

function handleMouseWheel(e) {
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var factor = Math.pow(1.3, delta);
    zoom(factor);
}

function zoom(factor) {
    zoomFactor = Math.max(1.0, Math.min(4.0, zoomFactor * factor));
    dirty = true;
}

function handlePinchEvent(e) {
    if (e.type === 'touchstart') {
        pinchLength = derivePinchLength(e);

    } else if (e.type === 'touchmove') {
        var length = derivePinchLength(e);
        zoom(length / pinchLength);
        pinchLength = length;
    }
}

function fixTouchEvent(e) {
    if (e.touches && e.touches.length === 1) {
        e.x = e.clientX = e.touches[0].clientX;
        e.y = e.clientY = e.touches[0].clientY;
    }
}

function derivePinchCenter(e) {
    var x1 = e.touches[0].clientX;
    var x2 = e.touches[1].clientX;

    var y1 = e.touches[0].clientY;
    var y2 = e.touches[1].clientY;

    var x = (x1 + x2) / 2;
    var y = (y1 + y2) / 2;

    return {'x': x, 'y': y};
}

function derivePinchLength(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function normalizeCoordinate(x) {
    return (x + MAP_WIDTH * DEFAULT_TILE_WIDTH) % (MAP_WIDTH * DEFAULT_TILE_WIDTH);
}

function normalizeTile(x) {
    return (x + MAP_WIDTH) % MAP_WIDTH;
}

function getTime() {
    return (new Date()).getTime();
}

init();

})();
