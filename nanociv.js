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

var CONTROL_PANEL_HEIGHT = 100;
var BUTTON_Y = 45;
var BUTTON_WIDTH = 80;
var BUTTON_HEIGHT = 35;
var BUTTON_PADDING = 10;

var CP_STATE_NONE = 0;
var CP_STATE_CITY = 1;
var CP_STATE_SETTLER = 2;
var CP_STATE_WARRIOR = 3;
var CP_STATE_MOVE = 4;
var CP_STATE_ATTACK = 5;

var CP_ACTION_SETTLER = 0;
var CP_ACTION_WARRIOR = 1;
var CP_ACTION_DEFEND = 2;
var CP_ACTION_MOVE = 3;
var CP_ACTION_BUILD = 4;
var CP_ACTION_ATTACK = 5;
var CP_ACTION_CANCEL = 6;
var CP_ACTION_NEXT = 7;
var CP_ACTION_END = 8;

var BUTTON_TEXT = [
    'Settler',
    'Warrior',
    'Defend',
    'Move',
    'Build',
    'Attack',
    'Cancel',
    'Next Unit',
    'End Turn'
];

var CP_BUTTONS = [
    /* CP_STATE_NONE */    [CP_ACTION_NEXT, CP_ACTION_END],
    /* CP_STATE_CITY */    [CP_ACTION_SETTLER, CP_ACTION_WARRIOR, CP_ACTION_DEFEND],
    /* CP_STATE_SETTLER */ [CP_ACTION_MOVE, CP_ACTION_BUILD, CP_ACTION_DEFEND],
    /* CP_STATE_WARRIOR */ [CP_ACTION_MOVE, CP_ACTION_ATTACK, CP_ACTION_DEFEND],
    /* CP_STATE_MOVE */    [CP_ACTION_CANCEL],
    /* CP_STATE_ATTACK */  [CP_ACTION_CANCEL]
];

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
var cpState = CP_STATE_NONE;
var selectedUnit = null;
var units = null;
var turn = 0;

function init() {
    createMap();
    updateCulture();

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
}

function createMap() {
    map = new Array(MAP_HEIGHT);

    for (var y = 0; y < MAP_HEIGHT; y++) {
        map[y] = new Array(MAP_WIDTH);
        for (var x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = {
                'x': x,
                'y': y,
                'type': TILE_WATER,
                'team': -1,
                'culture': new Array(MAX_PLAYERS),
                'unit': null};
        }
    }

    // Create continents / islands of land tiles
    var landTiles = [];
    for (var i = 0; i < 20; i++) {
        var centerX = Math.round(Math.random() * MAP_WIDTH);
        var centerY = Math.round((0.2 + Math.random() * 0.6) * MAP_HEIGHT);
        var size = Math.ceil(1 + Math.random() * 8);
        for (var dy = -size; dy <= size; dy++) {
            for (var dx = -size; dx <= size; dx++) {
                var x = centerX + dx;
                var y = centerY + dy;
                var dist = tileDist(centerX, centerY, x, y);
                if (dist <= size) {
                    var p = 1.0 - 0.25 * (dist / size);
                    if (Math.random() < p) {
                        var tile = getTile(x, y);
                        tile.type = TILE_LAND;
                        landTiles.push(tile);
                    }
                }
            }
        }
    }

    // Build a list of candidates for cities
    // Candidates must be land tiles with 3/3 water/land neighbors
    var candidates = [];
    for (var i = 0; i < landTiles.length; i++) {
        var landNeighbors = 0;
        for (var dy = -1; dy <= 1; dy++) {
            var y = landTiles[i].y + dy;
            if (y >= 1 && y < MAP_HEIGHT - 1) {
                for (var dx = -1; dx <= 1; dx++) {
                    if (dx !== 0 || dy !== 0) {
                        var x = landTiles[i].x + dx;
                        var dist = tileDist(landTiles[i].x, landTiles[i].y, x, y);
                        if (dist <= 1.0) {
                            var tile = getTile(x, y);
                            if (tile.type === TILE_LAND) {
                                landNeighbors++;
                            }
                        }
                    }
                }
            }
        }
        if (landNeighbors === 3) {
            candidates.push(landTiles[i]);
        }
    }

    // Identify the cities by choosing candidates that are
    // as far apart as possible.
    var cities = [];
    cities.push(candidates.shift());
    while (cities.length < MAX_PLAYERS) {
        var maxDist = 0;
        var maxIndex = 0;
        for (var i = 0; i < candidates.length; i++) {
            var minDist = MAP_WIDTH * MAP_HEIGHT;
            for (var j = 0; j < cities.length; j++) {
                var dist = tileDist(cities[j].x, cities[j].y, candidates[i].x, candidates[i].y);
                minDist = Math.min(minDist, dist);
            }
            if (minDist > maxDist) {
                maxDist = minDist;
                maxIndex = i;
            }
        }

        cities.push(candidates.splice(maxIndex, 1)[0]);
    }

    // Convert the city tiles into units.
    // Each civ gets a city, a settler, and a warrior.
    units = [];
    for (var i = 0; i < cities.length; i++) {
        var cityTile = cities[i];
        var cityUnit = {'type': UNIT_TYPE_CITY, 'team': i, 'x': cityTile.x, 'y': cityTile.y, 'level': 1};
        var settlerUnit = null;
        var warriorUnit = null;
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                var dist = tileDist(cityTile.x, cityTile.y, cityTile.x + dx, cityTile.y + dy);
                if (dist <= 1.0) {
                    var tile = getTile(cityTile.x + dx, cityTile.y + dy);
                    if ((dx !== 0 || dy !== 0) && tile.type === TILE_LAND && tile.unit === null) {
                        if (settlerUnit === null) {
                            settlerUnit = {'type': UNIT_TYPE_SETTLER, 'team': i, 'x': tile.x, 'y': tile.y, 'level': 1};
                        } else if (warriorUnit === null) {
                            warriorUnit = {'type': UNIT_TYPE_WARRIOR, 'team': i, 'x': tile.x, 'y': tile.y, 'level': 1};
                        }
                    }
                }
            }
        }

        units.push(cityUnit);
        units.push(settlerUnit);
        units.push(warriorUnit);
    }

    for (var i = 0; i < units.length; i++) {
        var unit = units[i];
        unit.health = unit.level;
        map[unit.y][unit.x]['unit'] = unit;
    }

    viewportX = units[0].x * DEFAULT_TILE_WIDTH;
    viewportY = units[0].y * DEFAULT_TILE_HEIGHT;
}

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

function updateCulture() {
    // Clear all culture
    for (var y = 0; y < MAP_HEIGHT; y++) {
        for (var x = 0; x < MAP_WIDTH; x++) {
            map[y][x].team = -1;
            for (var t = 0; t < MAX_PLAYERS; t++) {
                map[y][x].culture[t] = 0;
            }
        }
    }

    // Sum the culture impact from each city
    for (var i = 0; i < units.length; i++) {
        if (units[i].type === UNIT_TYPE_CITY) {
            var level = units[i].level;
            var x = units[i].x;
            var y = units[i].y;
            for (var dy = -level; dy <= level; dy++) {
                if (y + dy >= 0 && y + dy < MAP_HEIGHT) {
                    for (var dx = -level; dx <= level; dx++) {
                        var dist = tileDist(x, y, x + dx, y + dy);
                        if (dist <= level + 0.1) {
                            var tile = getTile(x + dx, y + dy);
                            var impact = 1 + level - Math.ceil(dist);
                            tile.culture[units[i].team] += impact;
                        }
                    }
                }
            }
        }
    }

    // Determine the city with the highest culture per tile
    for (var y = 0; y < MAP_HEIGHT; y++) {
        for (var x = 0; x < MAP_WIDTH; x++) {
            map[y][x].team = -1;
            var best = 0;
            for (var t = 0; t < MAX_PLAYERS; t++) {
                if (map[y][x].culture[t] > best) {
                    best = map[y][x].culture[t];
                    map[y][x].team = t;
                }
            }
        }
    }
}

function draw() {
    var ctx = bufferCtx;

    ctx.save();
    ctx.scale(PIXEL_DENSITY, PIXEL_DENSITY);
    drawOcean(ctx);
    drawLand(ctx);
    drawCulture(ctx);
    drawUnits(ctx);
    drawControlPanel(ctx);
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
            if (tile.type !== TILE_WATER && ((stage === 0 && tile.team === -1) || (stage === 1 && tile.team >= 0))) {
                createHexPath(ctx, tx, ty, tileWidth, tileHeight);
                ctx.fillStyle = COLORS[tile.team + 2][0];
                ctx.fill();
                ctx.strokeStyle = COLORS[tile.team + 2][2];
                ctx.stroke();
            }

            var unit = getUnit(x, y);
            if (stage === 2 && unit) {
                drawUnit(ctx, unit, tx, ty, tileWidth, tileHeight);
            }
        }
    }
}

function createHexPath(ctx, tx, ty, tileWidth, tileHeight) {
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

    ctx.beginPath();
    ctx.moveTo(drawX1, drawY2);
    ctx.lineTo(drawX2, drawY1);
    ctx.lineTo(drawX3, drawY2);
    ctx.lineTo(drawX3, drawY3);
    ctx.lineTo(drawX2, drawY4);
    ctx.lineTo(drawX1, drawY3);
    ctx.closePath();
}

function drawUnit(ctx, unit, tx, ty, tileWidth, tileHeight, noHighlight) {
    if (unit === selectedUnit && !noHighlight) {
        drawHighlight(ctx, tx, ty, tileWidth, tileHeight);
    }

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

function drawHighlight(ctx, tx, ty, tileWidth, tileHeight) {
    // Draw a yellow hex for highlight
    createHexPath(ctx, tx, ty, tileWidth, tileHeight);
    ctx.fillStyle = '#ff0';
    ctx.fill();
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

function drawControlPanel(ctx) {
    var x = selectedUnit ? 90 : 20;
    var y = viewportHeight - CONTROL_PANEL_HEIGHT;

    if (selectedUnit) {
        drawUnit(ctx, selectedUnit, -10, y - 18, CONTROL_PANEL_HEIGHT, CONTROL_PANEL_HEIGHT, true);

        var health = 100.0 * selectedUnit.health / selectedUnit.level;

        var str = 'Level ' + selectedUnit.level + ' ' +
                UNIT_NAMES[selectedUnit.type] +
                ', Strength ' + selectedUnit.health + ' (' + health.toFixed(1) + '%)';

        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        drawText(ctx, str, 90, y + 30, '#fff');
    }

    var buttons = CP_BUTTONS[cpState];
    var buttonX = x;
    var buttonY = BUTTON_Y + y;
    for (var i = 0; i < buttons.length; i++) {
        ctx.fillStyle = '#8ce';
        ctx.fillRect(buttonX, buttonY, BUTTON_WIDTH, BUTTON_HEIGHT);
        ctx.fillStyle = '#444';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(BUTTON_TEXT[buttons[i]], buttonX + 0.5 * BUTTON_WIDTH, buttonY + 0.6 * BUTTON_HEIGHT);
        buttonX += BUTTON_WIDTH + BUTTON_PADDING;
    }
}

function drawOverlays(ctx) {
    ctx.fillStyle = '#444';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Turn = ' + turn, 10, 20);
    ctx.fillText('FPS = ' + fps.toFixed(2), 10, 40);
}

function drawText(ctx, str, x, y, color) {
    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.strokeText(str, x, y);
    ctx.strokeText(str, x, y + 1);
    ctx.fillText(str, x, y);
    ctx.fillText(str, x, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
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

function getTileY(clientX, clientY) {
    var worldY = viewportY + (clientY - 0.5 * viewportHeight) / zoomFactor;
    var ty = Math.floor(worldY / DEFAULT_TILE_HEIGHT);
    return ty;
}

function getTileX(clientX, clientY) {
    var worldX = viewportX + (clientX - 0.5 * viewportWidth) / zoomFactor;
    var ty = getTileY(clientX, clientY);
    var tx = ty % 2 === 0 ? Math.floor(worldX / DEFAULT_TILE_WIDTH) : Math.floor(worldX / DEFAULT_TILE_WIDTH - 0.5);
    return tx;
}

function getTileAt(clientX, clientY) {
    var tx = getTileX(clientX, clientY);
    var ty = getTileY(clientX, clientY);
    return getTile(tx, ty);
}

function tileDist(x1, y1, x2, y2) {
    if (y1 % 2 === 1) {
        x1 += 0.5;
    }

    if (y2 % 2 === 1) {
        x2 += 0.5;
    }

    var dx = Math.abs(x2 - x1);
    if (dx > MAP_WIDTH / 2) {
        dx -= MAP_WIDTH;
    }

    var dy = 0.866 * (y2 - y1);
    return Math.sqrt(dx * dx + dy * dy);
}

function getUnit(x, y) {
    var tile = getTile(x, y);
    return tile && tile.unit;
}

function handleMouseDown(e) {
    e.preventDefault();
    fixTouchEvent(e);
    clickX = e.x;
    clickY = e.y;
    mouseDownTime = getTime();

    if (isOverControlPanel()) {
        return;
    }

    if (e.touches && e.touches.length === 2) {
        handlePinchEvent(e);
        return;
    }

    dragging = true;
}

function handleMouseMove(e) {
    e.preventDefault();
    fixTouchEvent(e);

    if (e.touches && e.touches.length === 2) {
        handlePinchEvent(e);
        return;
    }

    if (!isOverControlPanel() && dragging) {
        viewportX += (clickX - e.x) / zoomFactor;
        viewportY += (clickY - e.y) / zoomFactor;
        if (viewportY < 0) {
            viewportY = 0;
        }
        if (viewportY > MAP_HEIGHT * DEFAULT_TILE_HEIGHT) {
            viewportY = MAP_HEIGHT * DEFAULT_TILE_HEIGHT;
        }

        dirty = true;
    }

    clickX = e.x;
    clickY = e.y;
}

function handleMouseUp(e) {
    e.preventDefault();

    dragging = false;

    if (getTime() - mouseDownTime < 300) {
        if (isOverControlPanel()) {
            handleControlPanelClick();
        } else {
            handleMapClick();
        }
    }
}

function handleControlPanelClick() {
    var x = selectedUnit ? 90 : 20;
    var y = viewportHeight - CONTROL_PANEL_HEIGHT;
    var buttons = CP_BUTTONS[cpState];
    var buttonX = x;
    var buttonY = BUTTON_Y + y;
    for (var i = 0; i < buttons.length; i++) {
        if (clickX >= buttonX && clickX <= buttonX + BUTTON_WIDTH &&
                clickY >= buttonY && clickY <= buttonY + BUTTON_HEIGHT) {
            handleButtonAction(buttons[i]);
        }
        buttonX += BUTTON_WIDTH + BUTTON_PADDING;
    }
}

function handleButtonAction(action) {
    switch (action) {
    case CP_ACTION_MOVE:
        cpState = CP_STATE_MOVE;
        break;

    case CP_ACTION_ATTACK:
        cpState = CP_STATE_ATTACK;
        break;

    case CP_ACTION_BUILD:
        if (buildCity(selectedUnit)) {
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    case CP_ACTION_CANCEL:
        selectUnit(selectedUnit);
        break;

    case CP_ACTION_END:
        endTurn();
        break;

    default:
        console.log('Unhandled button action "' + BUTTON_TEXT[action] + '" (' + action + ')');
        break;
    }

    dirty = true;
}

function handleMapClick() {
    var tile = getTileAt(clickX, clickY);

    switch (cpState) {
    case CP_STATE_MOVE:
        var newX = getTileX(clickX, clickY);
        var newY = getTileY(clickX, clickY);
        if (moveUnit(selectedUnit, newX, newY)) {
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    case CP_STATE_ATTACK:
        var newX = getTileX(clickX, clickY);
        var newY = getTileY(clickX, clickY);
        if (attackUnit(selectedUnit, newX, newY)) {
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    default:
        selectUnit(tile && tile.unit);
    }

    dirty = true;
}

function handleMouseWheel(e) {
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var factor = Math.pow(1.3, delta);
    zoom(factor);
}

function isOverControlPanel(e) {
    return clickY > viewportHeight - CONTROL_PANEL_HEIGHT + BUTTON_Y;
}

function selectUnit(unit) {
    selectedUnit = unit || null;
    if (selectedUnit) {
        if (selectedUnit.type === UNIT_TYPE_CITY) {
            cpState = CP_STATE_CITY;
        } else if (selectedUnit.type === UNIT_TYPE_SETTLER) {
            cpState = CP_STATE_SETTLER;
        } else if (selectedUnit.type === UNIT_TYPE_WARRIOR) {
            cpState = CP_STATE_WARRIOR;
        }
    } else {
        cpState = CP_STATE_NONE;
    }
}

function moveUnit(unit, newX, newY) {
    if (getTile(newX, newY).unit !== null) {
        return false;
    }

    var oldX = selectedUnit.x;
    var oldY = selectedUnit.y;
    getTile(oldX, oldY).unit = null;
    getTile(newX, newY).unit = selectedUnit;
    selectedUnit.x = newX;
    selectedUnit.y = newY;
    return true;
}

function attackUnit(unit, targetX, targetY) {
    var other = getTile(targetX, targetY).unit;
    if (!other) {
        return false;
    }

    var p = Math.random();
    if (p < 0.5) {
        unit.health--;
    } else {
        other.health--;
    }

    if (other.health <= 0) {
        destroyUnit(other);
        moveUnit(unit, targetX, targetY);
    }

    return true;
}

function destroyUnit(unit) {
    map[unit.y][unit.x].unit = null;
    var index = units.indexOf(unit);
    if (index >= 0) {
        units.splice(index, 1);
    }
    if (unit.type === UNIT_TYPE_CITY) {
        updateCulture();
    }
}

function buildCity(unit) {
    unit.type = UNIT_TYPE_CITY;
    unit.level = 1;
    unit.health = 1;
    updateCulture();
    return true;
}

function endTurn() {
    for (var i = 0; i < units.length; i++) {
        if (units[i].type === UNIT_TYPE_CITY && units[i].level < 16) {
            units[i].level++;
            units[i].health++;
        }
    }

    updateCulture();
    turn++;
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
    if (e.touches && e.touches.length >= 1) {
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
