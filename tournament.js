'use strict';

/**
 * 
 *
 *
 */
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

    /**
     * Adds a listener 
     * @param {string} event Event name
     * @param {function} cb Function to call on event
     */
    on = function (event, cb) {
        if ((typeof event !== "string") || (typeof cb !== "function")) { return; }
        if (event === 'complete') {
            my.onComplete.push(cb);
        }
    };

    /**
     * Start a fight
     * 
     * @param robots Powers of Robot from team
     * @param {number[]} robots.A Powers of Robot from teamA
     * @param {number[]} robots.B Powers of Robot from teamB
     *
     * @returns living Robots
     */
    fight = function (robots, callback) {
        var cb, i, min_power, min_robot;

        cb = callback || noop;

        if (robots.A.length !== robots.B.length) {
            return callback(new Error("Fight want the same number of robots from each team"), robots);
        }
        for (i = robots.A.length - 1; i >= 0; i -= 1) {
            min_power = Math.min(robots.A[i], robots.B[i]);
            robots.A[i] -= min_power;
            robots.B[i] -= min_power;
        }
        return cb(null, robots);
    };

    /**
     *  Take robots from Teams and start a fight
     */
    match = function (callback) {
        var matchable, robots, cb;

        cb = callback || noop;

        matchable = Math.min(my.field, my.teamA.availableRobots(), my.teamB.availableRobots());
        robots = {};
        robots.A = my.teamA.takeNRobots(matchable);
        robots.B = my.teamB.takeNRobots(matchable);

        fight(robots, function (err, result) {
            if (err) {
                cb(err, result);
            }

            my.teamA.addRobots(result.A);
            my.teamB.addRobots(result.B);
        });
    };

    /**
     * Check if is there a winner
     */
    notAWinner = function () {
        return ((my.teamA.availableRobots() > 0) && (my.teamB.availableRobots() > 0));
    };

    /**
     * Start a tournament
     */
    start = function (callback) {
        var cb, fn;

        cb = callback || noop;

        fn = function (err, results) {
            if (err) {
                cb(err, results);
            }
        };

        while (notAWinner()) {
            match(fn);
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