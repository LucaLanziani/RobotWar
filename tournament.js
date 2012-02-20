'use strict';

var tournament = function (conf, team) {
    var that, my, fight, match,
        on, notAWinner, start, noop;

    that = {};
    my = {};
    my.field = conf.field;
    my.teamA = team(conf.robotsA);
    my.teamB = team(conf.robotsB);
    my.onComplete = [];

    noop = function () {};

    on = function (event, cb) {
        if ((typeof event !== "string") || (typeof cb !== "function")) { return; }
        if (event === 'complete') {
            my.onComplete.push(cb);
        }
    };

    fight = function (robotsA, robotsB, callback) {
        var fn, cb;

        cb = callback || noop;

        fn = function () {
            var i, min_power, min_robot;
            min_robot = Math.min(robotsA.length, robotsB.length);
            for (i = 0; i < min_robot; i += 1) {
                min_power = Math.min(robotsA[i], robotsB[i]);
                robotsA[i] -= min_power;
                robotsB[i] -= min_power;
            }
            cb(robotsA, robotsB);
        };

        return fn();
    };

    match = function () {
        var matchable, robotsA, robotsB;

        matchable = Math.min(my.field, my.teamA.availableRobots(), my.teamB.availableRobots());
        robotsA = my.teamA.takeNRobots(matchable);
        robotsB = my.teamB.takeNRobots(matchable);

        fight(robotsA, robotsB, function (resultA, resultB) {
            my.teamA.addRobots(resultA);
            my.teamB.addRobots(resultB);
        });
    };

    notAWinner = function () {
        return ((my.teamA.availableRobots() > 0) && (my.teamB.availableRobots() > 0));
    };

    start = function () {
        while (notAWinner()) {
            match();
        }

        my.onComplete.forEach(function (f) {
            f(my.teamA, my.teamB);
        });
    };

    that.on = on;
    that.run = start;
    that.start = start;
    return that;
};

module.exports = tournament;