(function (win, doc, ns) {

    'use strict';

    /*! -------------------------------------
        IMPORT
    ----------------------------------------- */
    var Stage  = ns.Stage,
        Actor  = ns.Actor,
        Actors = ns.Actors,
        Line   = ns.Line,
        Dot    = ns.Dot,

        //for Graph
        Graph       = ns.Graph,
        GraphData   = ns.GraphData,
        GraphMemory = ns.GraphMemory,
        GraphSpan   = ns.GraphSpan;


    //An entry point.
    function main() {

        console.log('Start app');

        var cont = doc.getElementById('graphContainer'),
            btn1 = doc.getElementById('data1'),
            btn2 = doc.getElementById('data2');



        //First data.
        var data = new GraphData({
            data: [ 220, 880, 660, 1500, 800, 920, 1540, 1760 ],
            color: '#c00'
        });

        //Secound data.
        var data2 = new GraphData({
            data: [ 1320, 1880, 1660, 1700, 1760, 1420, 1550, 1700 ],
            color: '#2983ff'
        });

        //Graph set up.
        var graph = new Graph(cont, {
            data: [data, data2],
            memory: {
                min: 0,
                max: 2200,
                div: 10
            },
            span: ['11/11', '11/15', '12/01', '12/05', '12/10', '12/19', '12/23', '12/29']
        });

        graph.on('drawend', function (e) {
            //do something if you want when `graph` ended.
        }, false);

        setTimeout(function () {
            graph.draw();
        }, 500);

        btn1.addEventListener('click', function (e) {
            e.stopPropagation();
            graph.select(0);
        }, false);

        btn2.addEventListener('click', function (e) {
            e.stopPropagation();
            graph.select(1);
        }, false);

        doc.addEventListener('click', function (e) {
            graph.select();
            return false;
        }, false);

        window.graph = graph;
    }

    //Start.
    window.addEventListener('DOMContentLoaded', main, false);

}(window, document, app));
