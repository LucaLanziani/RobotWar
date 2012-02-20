var team = function (robots) {
    var my, that, sort, addRobots, availableRobots,
        takeNRobots, getRobots;

    that = {};
    my = {};
    my.robots = robots || [];

    sort = function () {
        my.robots = my.robots.sort(function (a, b) { return b - a; });
    };

    addRobots = function (robots) {
        var toAdd = robots.filter(function (x) { return (x > 0 && x < 101); });

        my.robots = my.robots.concat(toAdd);
        sort();
    };

    availableRobots = function () {
        return my.robots.length;
    };

    takeNRobots = function (number) {
        var n, takeN, taken;

        n = number || availableRobots();
        takeN = Math.min(n, availableRobots());

        taken = my.robots.slice(0, takeN);
        my.robots = my.robots.slice(takeN);

        return taken;
    };

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