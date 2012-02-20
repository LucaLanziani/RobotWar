'use strict';
/**
 * Returns a team object
 *
 * @param 
 */
var team = function (robots) {
    var my, that, sort, addRobots, availableRobots,
        takeNRobots, getRobots;

    that = {};
    my = {};
    my.robots = robots || [];

    /**
     * Sorts the robots according to the power
     * From the stronger to weakest
     */
    sort = function () {
        my.robots = my.robots.sort(function (a, b) { return b - a; });
    };

    /**
     * Adds new robots to the team and sort it
     * 
     * @param {number[]} robots Array of power
     */
    addRobots = function (robots) {
        var toAdd = robots.filter(function (x) { return (x > 0 && x < 101); });

        my.robots = my.robots.concat(toAdd);
        sort();
    };

    /**
     * Returns the number of available robots
     */
    availableRobots = function () {
        return my.robots.length;
    };

    /**
     * Returns N robots and removes them from the team
     *
     * @param {number} number The number of robots to remove
     */
    takeNRobots = function (number) {
        var n, takeN, taken;

        n = number || availableRobots();
        takeN = Math.min(n, availableRobots());

        taken = my.robots.slice(0, takeN);
        my.robots = my.robots.slice(takeN);

        return taken;
    };

    /**
     * Returns the array of robots
     *
     */
    getRobots = function () {
        return my.robots;
    };

    sort();
    that.addRobots = addRobots;
    that.availableRobots = availableRobots;
    that.takeNRobots = takeNRobots;
    that.getRobots = getRobots;
    return that;
};

module.exports = team;