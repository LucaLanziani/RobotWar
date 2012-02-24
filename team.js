'use strict';
/**
 * Returns a team object
 *
 * @param 
 */

var Team = function (robots) {
    var that = this;

    that.robots = robots || [];
}

var prot = Team.prototype;

prot.sort = function () {
    var that = this;
    that.robots = that.robots.sort(function (a, b) { return b - a; });
};

/**
 * Adds new robots to the team and sort it
 * 
 * @param {number[]} robots Array of power
 */
prot.addRobots = function (robots) {
    var that = this;
    var toAdd = robots.filter(function (x) { return (x > 0 && x < 101); });

    that.robots = that.robots.concat(toAdd);
    that.sort();
};

/**
 * Returns the number of available robots
 */
prot.availableRobots = function () {
    return this.robots.length;
};

/**
 * Returns N robots and removes them from the team
 *
 * @param {number} number The number of robots to remove
 */
prot.takeNRobots = function (number) {
    var n, takeN, taken;

    n = number || this.availableRobots();
    takeN = Math.min(n, this.availableRobots());

    taken = this.robots.slice(0, takeN);
    this.robots = this.robots.slice(takeN);

    return taken;
};

/**
 * Returns the array of robots
 *
 */
prot.getRobots = function () {
    return this.robots;
};


var team = function(robots) {
    var obj;
    obj = new Team(robots);
    obj.sort();
    return obj;
}


module.exports = team;