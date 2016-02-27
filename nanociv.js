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

var COS_30 = 0.866025;

var DEFAULT_TILE_WIDTH = 10.0;
var DEFAULT_TILE_HEIGHT = COS_30 * DEFAULT_TILE_WIDTH;

var STAGE_OCEAN = 0;
var STAGE_LAND = 1;
var STAGE_CULTURE = 2;
var STAGE_UNITS = 3;

var TILE_WATER = 0;
var TILE_LAND = 1;
var MAX_PLAYERS = 5;

var INITIAL_ZOOM = 5.0;
var MIN_ZOOM = 1.0;
var MAX_ZOOM = 10.0;

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
var CP_ACTION_EXPLORE = 9;

var ORDER_NONE = 0;
var ORDER_DEFEND = 1;
var ORDER_BUILD_SETTLER = 2;
var ORDER_BUILD_WARRIOR = 3;
var ORDER_MOVE = 4;
var ORDER_ATTACK = 5;
var ORDER_EXPLORE = 6;

var FOG_BLACK = 0;
var FOG_REMEMBERED = 1;
var FOG_VISIBLE = 2;

var BUTTON_TEXT = [
    'Settler',
    'Warrior',
    'Defend',
    'Move',
    'Build',
    'Attack',
    'Cancel',
    'Next Unit',
    'End Turn',
    'Explore'
];

var CP_BUTTONS = [
    /* CP_STATE_NONE */    [CP_ACTION_NEXT, CP_ACTION_END],
    /* CP_STATE_CITY */    [CP_ACTION_SETTLER, CP_ACTION_WARRIOR, CP_ACTION_DEFEND],
    /* CP_STATE_SETTLER */ [CP_ACTION_MOVE, CP_ACTION_BUILD, CP_ACTION_EXPLORE, CP_ACTION_DEFEND],
    /* CP_STATE_WARRIOR */ [CP_ACTION_MOVE, CP_ACTION_ATTACK, CP_ACTION_EXPLORE, CP_ACTION_DEFEND],
    /* CP_STATE_MOVE */    [CP_ACTION_CANCEL],
    /* CP_STATE_ATTACK */  [CP_ACTION_CANCEL]
];

var COLORS = [
    ['#ccedff', '#ccedff', '#55636b', '#55636b'], // water
    ['#EFEBE9', '#D7CCC8', '#646262', '#5a5553'], // land
    ['#FFE0B2', '#F57C00', '#6b5d4a', '#673400'], // orange
    ['#BBDEFB', '#1976D2', '#4e5d69', '#0b3158'], // blue
    ['#FFCDD2', '#D32F2F', '#6b5658', '#581414'], // red
    ['#C8E6C9', '#388E3C', '#536054', '#173b19'], // green
    ['#E1BEE7', '#7B1FA2', '#5e4f61', '#340d44'], // purple
];

var UNIT_NAMES = [
    'City',
    'Settler',
    'Warrior'
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
var click = {x: 0, y: 0};
var mouseDownTime = 0;
var zoomFactor = INITIAL_ZOOM;
var tileWidth = zoomFactor * DEFAULT_TILE_WIDTH;
var tileHeight = zoomFactor * DEFAULT_TILE_HEIGHT;
var scrollCenter = {x: 0, y: 0};
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
    updateFog();

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
                'fog': new Array(MAX_PLAYERS),
                'remembered': new Array(MAX_PLAYERS),
                'unit': null};

            for (var i = 0; i < MAX_PLAYERS; i++) {
                map[y][x].fog[i] = FOG_BLACK;
                map[y][x].remembered[i] = -1;
            }
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
    var startingPoints = [];
    startingPoints.push(candidates.shift());
    while (startingPoints.length < MAX_PLAYERS) {
        var maxDist = 0;
        var maxIndex = 0;
        for (var i = 0; i < candidates.length; i++) {
            var minDist = MAP_WIDTH * MAP_HEIGHT;
            for (var j = 0; j < startingPoints.length; j++) {
                var dist = tileDist(startingPoints[j].x, startingPoints[j].y, candidates[i].x, candidates[i].y);
                minDist = Math.min(minDist, dist);
            }
            if (minDist > maxDist) {
                maxDist = minDist;
                maxIndex = i;
            }
        }

        startingPoints.push(candidates.splice(maxIndex, 1)[0]);
    }

    // Convert the city tiles into units.
    // Each civ gets a city, a settler, and a warrior.
    units = [];
    for (var i = 0; i < startingPoints.length; i++) {
        startingPoints[i].team = i;
        buildUnit(startingPoints[i], UNIT_TYPE_SETTLER);
        buildUnit(startingPoints[i], UNIT_TYPE_WARRIOR);
    }

    scrollCenter.x = units[0].x * DEFAULT_TILE_WIDTH;
    scrollCenter.y = units[0].y * DEFAULT_TILE_HEIGHT;
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

function updateFog() {
    // Move all "visible" to "remembered"
    for (var y = 0; y < MAP_HEIGHT; y++) {
        for (var x = 0; x < MAP_WIDTH; x++) {
            for (var t = 0; t < MAX_PLAYERS; t++) {
                if (map[y][x].fog[t] === FOG_VISIBLE) {
                    map[y][x].fog[t] = FOG_REMEMBERED;
                }
            }
        }
    }

    // For all units, calculate visible
    for (var i = 0; i < units.length; i++) {
        var u = units[i];
        var v = u.type === UNIT_TYPE_CITY ? 2 : 1;
        for (var dy = -v; dy <= v; dy++) {
            if (u.y + dy >= 0 && u.y < MAP_HEIGHT) {
                for (var dx = -v; dx <= v; dx++) {
                    var dist = tileDist(u.x, u.y, u.x + dx, u.y + dy);
                    if (dist <= v) {
                        var tile = getTile(u.x + dx, u.y + dy);
                        tile.fog[u.team] = FOG_VISIBLE;
                        tile.remembered[u.team] = tile.team;
                    }
                }
            }
        }
    }
}

function draw() {
    var ctx = bufferCtx;

    ctx.save();
    ctx.scale(PIXEL_DENSITY, PIXEL_DENSITY);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawOcean(ctx);
    drawLand(ctx);
    drawCulture(ctx);
    drawPath(ctx);
    drawUnits(ctx);
    drawControlPanel(ctx);
    drawOverlays(ctx);
    ctx.restore();
    canvasCtx.drawImage(buffer, 0, 0);
}

function drawOcean(ctx) {
    drawTileEngine(ctx, STAGE_OCEAN);
}

function drawLand(ctx) {
    drawTileEngine(ctx, STAGE_LAND);
}

function drawCulture(ctx) {
    drawTileEngine(ctx, STAGE_CULTURE);
}

function drawPath(ctx) {
    if (!selectedUnit) {
        return;
    }

    var goal = getTile(selectedUnit.destX, selectedUnit.destY);
    if (!goal) {
        return;
    }

    var start = getTile(selectedUnit.x, selectedUnit.y);
    var path = findPath(selectedUnit, start, goal);
    if (!path) {
        return;
    }

    ctx.beginPath();

    for (var i = 0; i < path.length; i++) {
        var point = tileToScreen(path[i]);
        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }

    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.stroke();

    for (var i = 0; i < path.length; i++) {
        var point = tileToScreen(path[i]);
        var radius = 0.1 * tileWidth;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
    }
}

function drawUnits(ctx) {
    drawTileEngine(ctx, STAGE_UNITS);
}

function drawTileEngine(ctx, stage) {
    var startX = Math.floor((scrollCenter.x - (0.5 * viewportWidth / zoomFactor)) / DEFAULT_TILE_WIDTH) - 2;
    var endX = Math.ceil((scrollCenter.x + (0.5 * viewportWidth / zoomFactor)) / DEFAULT_TILE_WIDTH);

    var startY = Math.max(0, Math.floor((scrollCenter.y - (0.5 * viewportHeight / zoomFactor)) / DEFAULT_TILE_HEIGHT) - 2);
    var endY = Math.min(MAP_HEIGHT, Math.ceil((scrollCenter.y + (0.5 * viewportHeight / zoomFactor)) / DEFAULT_TILE_HEIGHT));

    var lineWidth = Math.max(1, 0.5 * zoomFactor);
    ctx.lineWidth = lineWidth;

    for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
            var tile = getTile(x, y);
            if (tile.fog[0] === FOG_BLACK) {
                continue;
            }

            var tx = tileWidth * x - scrollCenter.x * zoomFactor + 0.5 * viewportWidth;
            var ty = tileHeight * y - scrollCenter.y * zoomFactor + 0.5 * viewportHeight;
            if (y % 2 === 1) {
                tx += tileWidth / 2;
            }

            if (stage === STAGE_OCEAN && tile.type === TILE_WATER) {
                // Draw ocean
                if (tile.fog[0] === FOG_VISIBLE) {
                    // Active colors
                    ctx.fillStyle = COLORS[0][0];
                    ctx.strokeStyle = COLORS[0][1];
                } else {
                    // Fog of war colors
                    ctx.fillStyle = COLORS[0][2];
                    ctx.strokeStyle = COLORS[0][3];
                }
                createHexPath(ctx, tx, ty, tileWidth, tileHeight);
                ctx.fill();
                ctx.stroke();
            }

            if (stage === STAGE_LAND && tile.type === TILE_LAND && tile.team === -1) {
                // Draw empty land
                if (tile.fog[0] === FOG_VISIBLE) {
                    ctx.fillStyle = COLORS[1][0];
                    ctx.strokeStyle = COLORS[1][1];
                } else {
                    ctx.fillStyle = COLORS[1][2];
                    ctx.strokeStyle = COLORS[1][3];
                }
                createHexPath(ctx, tx, ty, tileWidth, tileHeight);
                ctx.fill();
                ctx.stroke();
            }

            if (stage === STAGE_CULTURE && tile.type === TILE_LAND && tile.team >= 0) {
                // Draw culture
                if (tile.fog[0] === FOG_VISIBLE) {
                    ctx.fillStyle = COLORS[tile.team + 2][0];
                    ctx.strokeStyle = COLORS[tile.team + 2][1];
                } else {
                    ctx.fillStyle = COLORS[tile.team + 2][2];
                    ctx.strokeStyle = COLORS[tile.team + 2][3];
                }
                createHexPath(ctx, tx, ty, tileWidth, tileHeight);
                ctx.fill();
                ctx.stroke();
            }

            var unit = getUnit(x, y);
            if (stage === STAGE_UNITS && unit) {
                drawUnit(ctx, unit, tx, ty);
            }
        }
    }
}

function createHexPath(ctx, tx, ty) {
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

function drawUnit(ctx, unit, tx, ty, noHighlight) {
    if (unit === selectedUnit && !noHighlight) {
        drawHighlight(ctx, tx, ty);
    }

    ctx.fillStyle = COLORS[2 + unit.team][1];

    if (unit.type === UNIT_TYPE_CITY) {
        drawCity(ctx, tx, ty);
    } else if (unit.type === UNIT_TYPE_SETTLER) {
        drawSettler(ctx, tx, ty);
    } else if (unit.type === UNIT_TYPE_WARRIOR) {
        drawWarrior(ctx, tx, ty);
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

function drawHighlight(ctx, tx, ty) {
    // Draw a yellow hex for highlight
    createHexPath(ctx, tx, ty);
    ctx.fillStyle = '#ff0';
    ctx.fill();
}

function drawCity(ctx, tx, ty) {
    // Draw a square for a city
    var centerX = tx + 0.5 * tileWidth;
    var centerY = ty + 0.667 * tileHeight;
    var radius = 0.275 * tileWidth;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
}

function drawSettler(ctx, tx, ty) {
    // Draw a triangle for a settler
    var centerX = tx + 0.5 * tileWidth;
    var centerY = ty + 0.7 * tileHeight;
    var radius = 0.325 * tileWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX + COS_30 * radius, centerY + 0.5 * radius);
    ctx.lineTo(centerX - COS_30 * radius, centerY + 0.5 * radius);
    ctx.closePath();
    ctx.fill();
}

function drawWarrior(ctx, tx, ty) {
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
    var x = 20;
    var y = viewportHeight - CONTROL_PANEL_HEIGHT;

    if (selectedUnit) {
        var health = 100.0 * selectedUnit.health / selectedUnit.level;

        var str = 'Level ' + selectedUnit.level + ' ' +
                UNIT_NAMES[selectedUnit.type] +
                ', Strength ' + selectedUnit.health + ' (' + health.toFixed(1) + '%)';

        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        drawText(ctx, str, x, y + 30, '#fff');
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
    scrollCenter.x = normalizeCoordinate(scrollCenter.x);
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

function tileToScreen(tile) {
    var x = tileWidth * tile.x - scrollCenter.x * zoomFactor + 0.5 * viewportWidth + 0.5 * tileWidth;
    var y = tileHeight * tile.y - scrollCenter.y * zoomFactor + 0.5 * viewportHeight + 0.667 * tileHeight;
    if (tile.y % 2 === 1) {
        x += tileWidth / 2;
    }

    x = normalizeCoordinate(x);
    return {'x': x, 'y': y};
}

function getTileY(clientX, clientY) {
    var worldY = scrollCenter.y + (clientY - 0.5 * viewportHeight) / zoomFactor;
    var ty = Math.floor(worldY / DEFAULT_TILE_HEIGHT);
    return ty;
}

function getTileX(clientX, clientY) {
    var worldX = scrollCenter.x + (clientX - 0.5 * viewportWidth) / zoomFactor;
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

    var dy = COS_30 * (y2 - y1);
    return Math.sqrt(dx * dx + dy * dy);
}

function getUnit(x, y) {
    var tile = getTile(x, y);
    return tile && tile.unit;
}

function handleMouseDown(e) {
    e.preventDefault();
    fixTouchEvent(e);
    click.x = e.x;
    click.y = e.y;
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
        scrollCenter.x += (click.x - e.x) / zoomFactor;
        scrollCenter.y += (click.y - e.y) / zoomFactor;
        if (scrollCenter.y < 0) {
            scrollCenter.y = 0;
        }
        if (scrollCenter.y > MAP_HEIGHT * DEFAULT_TILE_HEIGHT) {
            scrollCenter.y = MAP_HEIGHT * DEFAULT_TILE_HEIGHT;
        }

        dirty = true;
    }

    click.x = e.x;
    click.y = e.y;
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
    var x = 20;
    var y = viewportHeight - CONTROL_PANEL_HEIGHT;
    var buttons = CP_BUTTONS[cpState];
    var buttonX = x;
    var buttonY = BUTTON_Y + y;
    for (var i = 0; i < buttons.length; i++) {
        if (click.x >= buttonX && click.x <= buttonX + BUTTON_WIDTH &&
                click.y >= buttonY && click.y <= buttonY + BUTTON_HEIGHT) {
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

    case CP_ACTION_SETTLER:
        if (buildUnit(selectedUnit, UNIT_TYPE_SETTLER)) {
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    case CP_ACTION_WARRIOR:
        if (buildUnit(selectedUnit, UNIT_TYPE_WARRIOR)) {
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    case CP_ACTION_EXPLORE:
        selectedUnit.order = ORDER_EXPLORE;
        explore(selectedUnit);
        selectedUnit = null;
        cpState = CP_STATE_NONE;
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
    var tile = getTileAt(click.x, click.y);

    switch (cpState) {
    case CP_STATE_MOVE:
        var newX = getTileX(click.x, click.y);
        var newY = getTileY(click.x, click.y);
        if (moveUnit(selectedUnit, newX, newY)) {
            selectedUnit.order = ORDER_MOVE;
            selectedUnit = null;
            cpState = CP_STATE_NONE;
        }
        break;

    case CP_STATE_ATTACK:
        var newX = getTileX(click.x, click.y);
        var newY = getTileY(click.x, click.y);
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
    return click.y > viewportHeight - CONTROL_PANEL_HEIGHT + BUTTON_Y;
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

function moveUnit(unit, goalX, goalY) {
    var start = getTile(unit.x, unit.y);
    var goal = getTile(goalX, goalY);
    if (!goal) {
        // Goal is out of bounds
        return false;
    }

    if (goal.type === TILE_WATER) {
        // Goal is water
        return false;
    }

    if (goal.unit !== null) {
        // There is a unit at the goal
        return false;
    }

    var path = findPath(unit, start, goal);
    if (!path) {
        // No path to the goal
        return false;
    }

    if (!unit.moved) {
        // If the unit has not moved yet,
        // go ahead and move one step.
        var next = path[0];
        start.unit = null;
        next.unit = unit;
        unit.x = next.x;
        unit.y = next.y;
        unit.destX = goalX;
        unit.destY = goalY;
        unit.moved = true;

        if (unit.order === ORDER_MOVE && unit.x === unit.destX && unit.y === unit.destY) {
            unit.order = ORDER_NONE;
        }
    }

    updateFog();
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

function combat(attacker, defender) {
    while (true) {
        var result = combatImpl(attacker, defender);
        if (result !== 0) {
            return result;
        }
    }
}

function combatImpl(attacker, defender) {
    var expected = attacker.level - defender.level;
    var stdev = Math.min(attacker.level, defender.level);
    return Math.round(expected + 2.0 * stdev * gaussian());
}

function gaussian() {
    var sum = 0.0;
    for (var i = 0; i < 6; i++) {
        sum += Math.random();
    }
    return sum / 6.0 - 0.5;
}

function explore(unit) {
    var start = getTile(unit.x, unit.y);
    if (!start) {
        return;
    }
    var path = findUnexplored(unit, start);
    if (!path) {
        return;
    }
    moveUnit(unit, path[0].x, path[0].y);
}

function destroyUnit(unit) {
    map[unit.y][unit.x].unit = null;
    var index = units.indexOf(unit);
    if (index >= 0) {
        units.splice(index, 1);
    }
    if (unit.type === UNIT_TYPE_CITY) {
        updateCulture();
        updateFog();
    }
}

function buildCity(unit) {
    var tile = getTile(unit.x, unit.y);
    if (!tile) {
        // Unit out of bounds.
        return false;
    }

    if (tile.type !== TILE_LAND) {
        // Tile is not land.
        return false;
    }

    if (!(tile.team === -1 || tile.team === unit.team)) {
        // Tile is owned by a different team.
        return false;
    }

    unit.type = UNIT_TYPE_CITY;
    unit.level = 1;
    unit.health = 1;
    unit.order = ORDER_NONE;
    unit.destX = unit.x;
    unit.destY = unit.y;
    updateCulture();
    updateFog();
    return true;
}

function buildUnit(city, unitType) {
    var unit = null;
    for (var d = 0; d < MAP_WIDTH && unit === null; d++) {
        for (var dy = -d; dy <= d && unit === null; dy++) {
            for (var dx = -d; dx <= d && unit === null; dx++) {
                var dist = tileDist(city.x, city.y, city.x + dx, city.y + dy);
                if (dist <= d) {
                    var tile = getTile(city.x + dx, city.y + dy);
                    if (tile.type === TILE_LAND && tile.unit === null) {
                        unit = {
                                'type': unitType,
                                'team': city.team,
                                'x': tile.x,
                                'y': tile.y,
                                'level': 1,
                                'health': 1,
                                'order': ORDER_NONE,
                                'moved': false
                            };
                        units.push(unit);
                        tile.unit = unit;
                        return unit;
                    }
                }
            }
        }
    }
    return null;
}

function endTurn() {
    for (var i = 0; i < units.length; i++) {
        if (units[i].order === ORDER_MOVE) {
            moveUnit(units[i], units[i].destX, units[i].destY);
        }

        if (units[i].order === ORDER_EXPLORE) {
            explore(units[i]);
        }

        if (units[i].type === UNIT_TYPE_CITY && units[i].level < 16) {
            units[i].level++;
            units[i].health++;
        }

        units[i].moved = false;
    }

    updateCulture();
    updateFog();
    turn++;
}

function zoom(factor) {
    zoomFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomFactor * factor));
    tileWidth = zoomFactor * DEFAULT_TILE_WIDTH;
    tileHeight = zoomFactor * DEFAULT_TILE_HEIGHT;
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

function findPath(unit, start, goal) {
    return dijkstraSearch(unit, start, function(u) { return u === goal; });
}

function findUnexplored(unit, start) {
    return dijkstraSearch(unit, start, function(u) { return u.fog[unit.team] === FOG_BLACK; });
}

function dijkstraSearch(unit, start, goalFn) {
    for (var y = 0; y < MAP_HEIGHT; y++) {
        for (var x = 0; x < MAP_WIDTH; x++) {
            map[y][x].dist = Number.MAX_VALUE;
            map[y][x].prev = null;
        }
    }

    var q = [];
    q.push(start);
    start.dist = 0;
    start.prev = null;

    while (q.length > 0) {
        var u = null;
        var ui = -1;
        for (var i = 0; i < q.length; i++) {
            if (u === null || q[i].dist < u.dist) {
                u = q[i];
                ui = i;
            }
        }

        if (goalFn(u)) {
            var path = [];
            while (u.prev !== null) {
                path.push(u);
                u = u.prev;
            }
            path.reverse();
            return path;
        }

        // Remove the element from the queue
        q.splice(ui, 1);

        for (var dy = -1; dy <= 1; dy++) {
            if (u.y + dy >= 0 && u.y + dy < MAP_HEIGHT) {
                for (var dx = -1; dx <= 1; dx++) {
                    var dist = tileDist(u.x, u.y, u.x + dx, u.y + dy);
                    if (dist <= 1.0) {
                        var v = getTile(u.x + dx, u.y + dy);
                        if ((v.fog[unit.team] === FOG_BLACK || v.type === TILE_LAND) && v.unit === null && v.dist > u.dist + 1) {
                            v.dist = u.dist + 1;
                            v.prev = u;
                            q.push(v);
                        }

                    }
                }
            }
        }
    }

    return null;
}

init();

})();
