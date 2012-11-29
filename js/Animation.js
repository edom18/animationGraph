var app = app || {};

(function (ns, win, doc) {

    'use strict';

    /*! -------------------------------------
        IMPORT
    ----------------------------------------- */
    var utils = f.utils,
        EventDispatcher = f.events.EventDispatcher;

    function noop () { /* noop. */ }
    function _each(arr, func) {
        if (({}).toString.call(func) !== '[object Function]') {
            return false;
        }

        for (var i = 0, l = arr.length; i < l; i++) {
            if (func(arr[i], i) === false) {
                break;
            }
        }
    }

    /**
     * Stage
     */
    function Stage (cv) {
        this.init.apply(this, arguments);
    }
    utils.copyClone(Stage.prototype, EventDispatcher.prototype, {
        init: function (cv, attr) {

            attr || (attr = {});

            this._cv       = cv;
            this._ctx      = cv.getContext('2d');
            this._width    = cv.width;
            this._height   = cv.height;
            this._actors   = [];
            this._time     = attr.time || 1000; //Default time is 5 sec.
            this._endActor = 0;
        },
        add: function (actor) {
            if (!Actor.prototype.isPrototypeOf(actor)) {
                throw new Error('Parameter MUST be taken Actor class and extended class.');
            }

            actor.on('end', this.done, this);
            this._actors.push(actor);
        },
        getActors: function () {
            return utils.makeArr(this._actors);
        },
        setActors: function (actors) {
            if (!utils.isArray(actors)) {
                return false;
            }

            this._actors = actors;
        },

        /**
         * Get actor at `index`
         * @param {number} index
         */
        getActorAt: function (index) {
            return this._actors[index];
        },
        each: function (func) {
            _each(this._actors, func);
        },
        animete: function () {

            var self        = this,
                startTime   = +new Date(),
                currentTime = 0,
                endTime     = this._time,
                INTERVAL    = 1000 / 30;

            (function loop() {

                var now = 0;

                if (self.isEnd()) {
                    console.log('End of Stage!');
                    self.trigger('animationend');
                    return;
                }

                self.clear();

                self.each(function (actor) {
                    actor.update();
                    actor.draw();
                });

                now = +new Date();
                currentTime = now - startTime;
                self.timer = setTimeout(loop, INTERVAL);
            }());
        },
        draw: function () {
            this.each(function (actor) {
                actor.draw();
            });
        },
        redraw: function () {
            this.clear();
            this.draw();
        },
        start: function () {
            this.animete();
        },
        isEnd: function () {
            return this._ended;
        },
        done: function () {
            this._endActor++;
            if (this._endActor === this._actors.length) {
                this._ended = true;
            }
        },
        clear: function () {
            this._ctx.clearRect(0, 0, this._width, this._height);
        }
    });
    Stage.prototype.constructor = Stage;


    ////////////////////////////////////////////////////////////////////////////////////////
    

    /**
     * Actor
     */
    function Actor () {
        this.init.apply(this, arguments);
    }
    utils.copyClone(Actor.prototype, EventDispatcher.prototype, {
        init: noop,
        easing: function (t, b, c, d) {
            return b + (c * t / d);
        },
        update: function () {
            this.updateInternal();
            if (this.isEnd()) {
                this.update = noop;
                this.trigger('end');
            }
        },
        updateInternal: function () { throw new Error('MUST BE IMPLEMENTS THE `update` METHOD'); },
        draw: function () { throw new Error('MUST BE IMPLEMENTS THE `draw` METHOD'); },
        isEnd: function () { throw new Error('MUST BE IMPLEMENTS THE `isEnd` METHOD'); },
        
        /**
         * Set a new color.
         * @param {string} color A new color.
         */
        setColor: function (color) {
            this._previousColor = this._color;
            this._color = color;
        },

        /**
         * Get previous color.
         * @return {string} Previous color.
         */
        getPreviousColor: function () {
            return this._previousColor;
        },

        /**
         * Revert to default color.
         */
        revertColor: function () {
            this.setColor(this._defaultColor);
        },
    });
    Actor.prototype.constructor = Actor;

    ///////////////////////////////////////////////////////////////////////////

    /**
     * Actors class
     * @constructor
     * @extend Actor
     * @param {Array.<Actor>} actors
     */
    function Actors () {
        this.init.apply(this, arguments);
    }

    //Extend by Actor.
    Actors.prototype = new Actor();

    /** @override */
    Actors.prototype.init = function (actors) {
        this._actors = actors || [];
        this._index = 0;
        this._currentActor = this._actors[0];
    };

    /** @override */
    Actors.prototype.updateInternal = function () {

        var activeIndex = this._index;
        
        this.each(function (actor, i) {
            actor.update();

            if (i === activeIndex) {
                return false;
            }
        });

        if (this._currentActor.isEnd()) {
            this._currentActor = this.next();
        }
    };

    /** @override */
    Actors.prototype.draw = function () {
        this.each(function (actor) {
            actor.draw();
        });
    };

    /** @override */
    Actors.prototype.isEnd = function () {
        return !this._currentActor;
    };

    Actors.prototype.next = function () {
        if (!this.hasNext()) {
            return null;
        }
        return this._actors[++this._index];
    };

    Actors.prototype.hasNext = function () {
        return (this._index + 1 < this._actors.length);
    };

    Actors.prototype.each = function (func) {
        _each(this._actors, func);
    };

    /**
     * Set a new color.
     * @param {string} color A new color.
     */
    Actors.prototype.setColor = function (color) {
        this.each(function (actor) {
            actor.setColor(color);
        });
    };

    /**
     * Revet to default color.
     */
    Actors.prototype.revertColor = function () {
        this.each(function (actor) {
            actor.revertColor();
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Line class
     * @constructor
     * @extend Actor
     * @param {CanvasElement} cv
     * @param {number} sx start x.
     * @param {number} sy start y.
     * @param {number} ex end x.
     * @param {number} ey end y.
     * @param {Object} opt An option.
     */
    function Line (cv, sx, sy, ex, ey, opt) {
        this.init.apply(this, arguments);
    }

    //Extend by Actor.
    Line.prototype = new Actor();

    /** @override */
    Line.prototype.init = function (cv, sx, sy, ex, ey, opt) {

        opt || (opt = {});

        this._cv  = cv;
        this._ctx = cv.getContext('2d');
        this._sx  = sx;
        this._sy  = sy;
        this._ex  = ex;
        this._ey  = ey;
        this._t   = 0;
        this._d   = 5;
        this._color = opt.color || '#666';
        this._defaultColor = this._color;
    };

    /** @override */
    Line.prototype.updateInternal = function () {
        this._t++;
        this._x = this.easing(this._t, this._sx, this._ex - this._sx, this._d);
        this._y = this.easing(this._t, this._sy, this._ey - this._sy, this._d);
    };

    /** @override */
    Line.prototype.draw = function () {
        var ctx = this._ctx;

        ctx.save();
        ctx.beginPath();
        
        ctx.strokeStyle = this._color;
        ctx.moveTo(this._sx, this._sy);
        ctx.lineTo(this._x, this._y);
        ctx.stroke();

        ctx.closePath();
        ctx.restore();
    };

    /**
     * Check to end.
     */
    Line.prototype.isEnd = function () {
        return this._t >= this._d;
    };

    ///////////////////////////////////////////////////////////////////////

    /**
     * Dot class
     * @constructor
     * @extend Actor
     * @param {CanvasElement} cv
     * @param {number} x position x.
     * @param {number} y position y.
     * @param {number} sr start radius.
     * @param {number} er end radius.
     * @param {Object} opt An option.
     */
    function Dot(cv, x, y, sr, er) {
        this.init.apply(this, arguments);
    }

    //Extend by Actor.
    Dot.prototype = new Actor();

    /** @override */
    Dot.prototype.init = function (cv, x, y, sr, er, opt) {

        opt || (opt = {});

        this._cv  = cv;
        this._ctx = cv.getContext('2d');
        this._x   = x;
        this._y   = y;
        this._sr  = sr;
        this._er  = er;
        this._t   = 0;
        this._d   = 5;
        this._color = opt.color || '#666';
        this._defaultColor = this._color;
    };

    /** @override */
    Dot.prototype.updateInternal = function () {
        this._t++;
        this._r = this.easing(this._t, this._sr, this._er - this._sr, this._d);
    };

    Dot.prototype.easing = function (t, b, c, d) {
        var s = 2.5;

        if (t / d >= 1) {
            return b + c;
        }

        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    };

    /** @override */
    Dot.prototype.draw = function () {
        var ctx = this._ctx;

        ctx.save();
        ctx.beginPath();
        
        ctx.fillStyle = this._color;
        ctx.moveTo(this._x, this._y);
        ctx.arc(this._x, this._y, this._r, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.closePath();
        ctx.restore();
    };

    /**
     * Check to end.
     */
    Dot.prototype.isEnd = function () {
        return this._t >= this._d;
    };


    /*! =============================================================
        EXPORTS
    ================================================================= */
    ns.Actor  = Actor;
    ns.Actors = Actors;
    ns.Stage  = Stage;
    ns.Line   = Line;
    ns.Dot    = Dot;

}(app, window, document));
