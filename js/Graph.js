var app = app || {};

(function (ns, win, doc, exports, undefined) {

    'use strict';

    /*! -------------------------------------
        IMPORT
    ----------------------------------------- */
    var utils = f.utils,
        EventDispatcher = f.events.EventDispatcher,

        //Actors
        Stage  = ns.Stage,
        Actor  = ns.Actor,
        Actors = ns.Actors,
        Line   = ns.Line,
        Dot    = ns.Dot;

    function noop () {
        //noop.
    }

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
     * Graph class
     * @constructor
     * @param {Element} container
     * @param {Object} args
     *        {Object.<Array.<GraphData>>} data
     *        {Object.<Object>} memory
     *        {Object<Array.<number>>} span
     */
    function Graph (container, args) {
        this.init.apply(this, arguments);
    }
    utils.copyClone(Graph.prototype, EventDispatcher.prototype, {
        init: function (container, args) {

            args || (args = {});

            var cvs = [];

            this._container = container;
            this._container.className += ' graph-container';

            cvs = this._createCanvas(container.clientWidth, container.clientHeight);

            this._cv        = cvs[0];
            this._memory    = new GraphMemory(cvs[1], args.memory);
            this._span      = new GraphSpan(cvs[2], args.span, {
                baseLine: this._memory.getHeight()
            });
            this._stage     = new Stage(this._cv);
            this._graphData = [];
            this._actors    = [];

            for (var i = 0, l = args.data.length; i < l; i++) {
                this.add(args.data[i]);
            }

            this._createGraphData();

            //Event handlers.
            this._stage.on('animationend', this.done, this);
        },

        each: function (func) {
            _each(this._graphData, func);
        },

        /**
         * Create canvas for memory and span.
         * @param {number} w The container's width
         * @param {number} h The container's height
         */
        _createCanvas: function (w, h) {
            var cv1 = doc.createElement('canvas'),
                cv2 = doc.createElement('canvas'),
                cv3 = doc.createElement('canvas');

            cv1.width = cv2.width = cv3.width = w;
            cv1.height = cv2.height = cv3.height = h;

            cv1.className = 'graph-canvas';
            cv2.className = 'graph-memory';
            cv3.className = 'graph-span';

            this._container.appendChild(cv3);
            this._container.appendChild(cv2);
            this._container.appendChild(cv1);

            return [cv1, cv2, cv3];
        },

        /**
         * Create graph data.
         */
        _createGraphData: function () {

            var self = this;

            this.each(function (graphData) {

                var sx = 0,
                    sy = 0,
                    ex = 0,
                    ey = 0,
                    r  = 3,
                    actors = [],
                    cv     = self._cv,
                    color  = graphData.getColor(),
                    data   = graphData.getData(),
                    width  = self._span.getWidth(),
                    height = self._memory.getHeight(),
                    max    = self._memory.getMax(),
                    left   = self._span.getLeft(),
                    horDiv = self._span.getDivision(),
                    verDiv = self._memory.getDivision(),
                    bottom = self._memory.getHeight(),
                    baseX = width / horDiv,
                    d = null;

                for (var i = 0, l = horDiv; i <= l; i++) {
                    d = data[i];
                    sx = (baseX * i) + left;
                    sy = bottom - ((d / max * height));

                    actors.push(new Dot(cv, sx, sy, 0, r, {color: color}));

                    if ((d = data[i + 1])) {
                        ex = (baseX * (i + 1)) + left;
                        ey = bottom - ((d / max * height));
                        actors.push(new Line(cv, sx, sy, ex, ey, {color: color}));
                    }
                }

                self.addActor(new Actors(actors));
            });
        },

        /**
         * Draw the Graph.
         */
        draw: function () {
            this._stage.start();
        },

        /**
         * Add a graph data.
         * @param {GraphData} graphdata
         */
        add: function (graphdata) {
            if (GraphData.isPrototypeOf(graphdata)) {
                throw new Error('`data` of arguments must be instance that created by GraphData.');
            }
            this._graphData.push(graphdata);
        },

        addActor: function (actor) {
            if (!Actor.prototype.isPrototypeOf(actor)) {
                throw new Error('actor of arguments must be Actor instance.');
            }
            this._stage.add(actor);
        },

        /**
         * Select graph by index.
         * @param {number} index
         */
        select: function (index) {

            var preActors,
                actors,
                actor;

            if (!this._stage.isEnd()) {
                return false;
            }

            if (index === undefined) {
                this._index = null;
                this._stage.each(function (actor) {
                    actor.revertColor();
                });

                //Redraw
                this._stage.redraw();

                return;
            }

            this._index = index;

            //Get actors as previous one and normal one.
            preActors = this._stage.getActors();
            actors = this._stage.getActors();

            //Get an actor at index.
            actor = this._stage.getActorAt(index);

            if (!actor) {
                throw new Error('Not found the actor at ' + index + ' of index.');
            }

            for (var i = 0, l = actors.length; i < l; i++) {
                actors[i].setColor('#aaa');
            }

            //Will be back to previous color.
            actor.revertColor();

            actors.splice(index, 1);
            actors.push(actor);

            //set in oerder to by z-index array.
            this._stage.setActors(actors);

            //Redraw
            this._stage.redraw();

            this._stage.setActors(preActors);

            actors    = null;
            actor     = null;
            preActors = null;
        },

        /**
         * This invoked when all of graph are done.
         */
        done: function () {
            this.trigger('drawend');
        }
    });
    Graph.prototype.constructor = Graph;

    ////////////////////////////////////////////////////////////////////////

    /**
     * Graph data
     * @constructor
     * @param {Object} data
     */
    function GraphData (args) {
        this.init.apply(this, arguments);
    }
    GraphData.prototype = {
        init: function (args) {
            this._data  = args.data;
            this._color = args.color;
        },
        getColor: function () {
            return this._color;
        },
        getData: function () {
            return utils.makeArr(this._data);
        }
    };
    GraphData.prototype.constructor = GraphData;

    ////////////////////////////////////////////////////////////////////////

    /**
     * Graph memory class
     * @constructor
     * @param {number} min Number of min to memory.
     * @param {number} max Number of max to memory.
     * @param {number} div Division number.
     * @example
     *  new GraphMemory(0, 2200, 10);
     */
    function GraphMemory (cv, min, max, div) {
        this.init.apply(this, arguments);
    }
    GraphMemory.prototype = {
        init: function (cv, args) {
            this._cv  = cv;
            this._ctx = cv.getContext('2d');
            this._min = args.min;
            this._max = args.max;
            this._div = args.div;
            this._padding = 30;
            this._txtLine = 50;
            this._startLine = 30;

            this.draw();
        },

        /**
         * @return {number} The memory width.
         */
        getWidth: function () {
            return this._txtLine;
        },

        /**
         * @return {number} The memory height.
         */
        getHeight: function () {
            return this._cv.height - (this._padding * 2) - this.getTxtHeight() + this._startLine;
        },

        /**
         * @return {number} memory width.
         */
        getTxtWidth: function () {
            var txtRect = this._ctx.measureText(this._max);
            return txtRect.width;
        },

        /**
         * @return {number} memory height.
         */
        getTxtHeight: function () {
            return 20;
        },
        getTop: function () {
            return this._startLine - 10;
        },
        _drawVerticalLine: function () {

            var cv       = this._cv,
                ctx      = this._ctx,
                w        = cv.width,
                h        = this.getHeight(),
                txtWidth = this.getTxtWidth(),
                baseLine = this._txtLine + 5;

            ctx.save();
            ctx.beginPath();

            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.moveTo(baseLine, this.getTop());
            ctx.lineTo(baseLine, h);
            ctx.stroke();

            ctx.closePath();
            ctx.restore();
        },
        draw: function () {

            var cv   = this._cv,
                ctx  = this._ctx,
                w    = cv.width,
                h    = this.getHeight() - this._startLine,
                verTxtLine = this._txtLine + 5,
                txtWidth = this.getTxtWidth(),
                base = h / this._div,
                baseTxt = ~~((this._max - this._min) / this._div),
                curHeight = 0;

            this._drawVerticalLine();

            ctx.save();
            ctx.textAlign = 'right';
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#d6d6d6';
            for (var i = 0, l = this._div; i <= l; i++) {
                ctx.beginPath();

                curHeight = (h - base * i) + this._startLine;
                ctx.fillText(baseTxt * i, this._txtLine,  curHeight);

                if (i !== 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.fillStyle = '#d6d6d6';
                    ctx.fillRect(verTxtLine, curHeight - 2, w - (verTxtLine + this._padding), 1);
                    ctx.closePath();
                    ctx.restore();
                }

                ctx.closePath
            }
            ctx.restore();
        },
        getMax: function () {
            return this._max;
        },
        getMin: function () {
            return this._min;
        },
        getDivision: function () {
            return this._div;
        }
    };
    GraphMemory.prototype.constructor = GraphMemory;

    ////////////////////////////////////////////////////////////////////////

    /**
     * Graph span class
     * @constructor
     * @param {CanvasElement} cv
     * @param {Object} spanList
     */
    function GraphSpan (cv, spanList, opt) {
        this.init.apply(this, arguments);
    }
    GraphSpan.prototype = {
        init: function (cv, spanList, opt) {

            opt || (opt = {});

            this._cv       = cv;
            this._ctx      = cv.getContext('2d');
            this._spanList = spanList;
            this._div      = spanList.length - 1;

            this._padding  = 30;
            this._txtLine  = 50;
            this._baseLine = opt.baseLine || 30;
            this._startLine = opt.startLine || 55;

            this.draw();
        },
        getDivision: function () {
            return this._div;
        },
        getLeft: function () {
            return this._startLine;
        },
        getBaseline: function () {
            return this._baseLine;
        },
        getWidth: function () {
            return this._cv.width - this._padding - this._startLine;
        },
        getHeight: function () {
            return 30;
        },

        /**
         * Draw a horizontal line as saparetor.
         */
        _drawLine: function () {

            var ctx       = this._ctx,
                w         = this.getWidth(),
                startLine = this.getLeft();

            ctx.save();
            ctx.beginPath();

            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.moveTo(startLine, this.getBaseline());
            ctx.lineTo(startLine + w, this._baseLine);
            ctx.stroke();

            ctx.closePath();
            ctx.restore();
        },
        draw: function () {

            var cv   = this._cv,
                ctx  = this._ctx,
                w    = this.getWidth(),
                h    = cv.height,
                base = w / this._div,
                curWidth = 0;

            this._drawLine();

            ctx.save();
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 20;

            for (var i = 0, l = this._spanList.length; i < l; i++) {
                ctx.beginPath();

                curWidth = this._startLine + (base * i);
                ctx.fillText(this._spanList[i], curWidth, this._baseLine + 5);

                if (i % 2 === 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.fillStyle = '#f0f0f0';
                    //ctx.moveTo(curWidth - 10, this._baseLine - 1);
                    //ctx.lineTo(curWidth - 10, this._padding - 2);
                    //ctx.stroke();

                    ctx.fillRect(curWidth, this._baseLine - 1, base, -(h - (h - this._baseLine) - this._padding / 1.5));
                    ctx.closePath();
                    ctx.restore();
                }

                ctx.closePath();
            }
            ctx.restore();
        }
    };
    GraphSpan.prototype.constructor = GraphSpan;


    /*! =============================================================
        EXPORTS
    ================================================================= */
    ns.Graph       = Graph;
    ns.GraphData   = GraphData;
    ns.GraphMemory = GraphMemory;
    ns.GraphSpan   = GraphSpan;

}(app, window, document));
