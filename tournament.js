'use strict';

var noop = function () {};

var Tournament = function (conf, team) {
    var that;
    that = this;

    that.field = conf.field;
    that.teamA = team(conf.robotsA);
    that.teamB = team(conf.robotsB);
    that.onComplete = [];
}

var prot = Tournament.prototype;

/**
 * Adds a listener 
 * @param {string} event Event name
 * @param {function} cb Function to call on event
 */
prot.on = function (event, cb) {
    if ((typeof event !== "string") || (typeof cb !== "function")) { return; }
    if (event === 'complete') {
        this.onComplete.push(cb);
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
prot.fight = function (robots, callback) {
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
prot.match = function (callback) {
    var matchable, robots, cb, that;

    that = this;
    cb = callback || noop;

    matchable = Math.min(that.field, that.teamA.availableRobots(), that.teamB.availableRobots());
    robots = {};
    robots.A = that.teamA.takeNRobots(matchable);
    robots.B = that.teamB.takeNRobots(matchable);

    that.fight(robots, function (err, result) {
        if (err) {
            cb(err, result);
        }

        that.teamA.addRobots(result.A);
        that.teamB.addRobots(result.B);
    });
};

/**
 * Check if is there a winner
 */
prot.notAWinner = function () {
    return ((this.teamA.availableRobots() > 0) && (this.teamB.availableRobots() > 0));
};

/**
 * Start a tournament
 */
prot.start = function (callback) {
    var cb, fn, that;
    that = this;
    cb = callback || noop;

    fn = function (err, results) {
        if (err) {
            cb(err, results);
        }
    };

    while (that.notAWinner()) {
        that.match(fn);
    }

    that.onComplete.forEach(function (f) {
        f(that.teamA, that.teamB);
    });
};

var tournament = function(conf, team) {
    var obj = new Tournament(conf, team)
    return obj;
};

module.exports = tournament;