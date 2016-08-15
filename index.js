/* global _ */
/* eslint-env browser, jquery, es6 */
"use strict";

const maxx = 16, maxy = 16;

const site = $('#site');

const gol = $('<ol>', { id: 'gol' });
gol.appendTo(site);

let changed = new Set();

let grid = [];

/**
 * @class
 * @param x {number}
 * @param y {number}
 */
function Coord(x, y) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
}

Coord.prototype.toString = function() {
    return `[Coord { ${ this.x }, ${ this.y } }]`;
};

function maybeGet(x, y) {
    const t1 = grid[y];
    if (!t1) {
        return null;
    }
    return t1[x] || null;
}

class Cell {
    constructor(x, y) {
        this.coords = new Coord(x, y);
        this.el = this.createElement();
        this.changed = false;

        this._alive = false;
        this._tempAlive = false;
    }

    get alive() {
        return this._alive;
    }

    set alive(alive) {
        this._tempAlive = alive;
    }

    commit() {
        if (this._alive != this._tempAlive) {
            this._alive = this._tempAlive;
            this.el.prop('checked', this.alive);
            changed.add(this);
        }
    }

    handleChange() {
        this._alive = this.el.is(':checked');
        changed.add(this);
    }

    createElement() {
        const cbox = $('<input>', {
            type: 'checkbox',
            class: 'gol-i',
        });
        cbox.on('change', this.handleChange.bind(this));
        return cbox;
    }

    toString() {
        return `[Cell { ${ this.coords.x }, ${ this.coords.y } } - ${ this.alive ? 'alive' : 'dead' } ]`;
    }

    * friends() {
        const { x, y } = this.coords;
        for (let ix = -1; ix < 2; ix++) {
            for (let iy = -1; iy < 2; iy++) {
                const cell = maybeGet(x + ix, y + iy);
                if (cell && cell !== this) {
                    yield cell;
                }
            }
        }
    }

    isAlive() {
        let i = 0;
        for (let cell of this.friends()) {
            if (cell.alive) {
                i++;
            }
            if (i > 3) {
                return false;
            }
        }
        if (this.alive) {
            return i >= 2;
        }
        return i == 3;
    }
}

for (let y = 0; y < maxy; y++) {
    grid[y] = [];
    const line = $('<li>', { class: 'goll' });
    for (let x = 0; x < maxx; x++) {
        const cell = new Cell(x, y);
        line.append(cell.el);
        grid[y][x] = cell;
    }
    gol.append(line);
}

function step() {
    if (!changed.size) {
        return;
    }
    console.log("Tick!");
    let toCheck = new Set();
    for (let ccell of changed) {
        toCheck.add(ccell);
        for (let cell of ccell.friends()) {
            toCheck.add(cell);
        }
    }
    changed.clear();
    for (let cell of toCheck) {
        cell.alive = cell.isAlive();
    }
    for (let cell of toCheck) {
        cell.commit();
    }
}

const playspeed = $('#playspeed');
const playpause = $('#playpause');
let intervalKey;
playpause.on('click', () => {
    if (intervalKey) {
        window.clearInterval(intervalKey);
        intervalKey = null;
        playspeed.prop('disabled', false);
        playpause.text('Start');
    } else {
        intervalKey = window.setInterval(step, playspeed.val());
        playspeed.prop('disabled', true);
        step();
        playpause.text('Stop');
    }
})

$('#step').on('click', step);
