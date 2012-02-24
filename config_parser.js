'use strict';


var noop = function() {};

var ConfigParser = function(data) {
    var that = this;

    that.rawData = data;
    that.pattern = / /g;
    that.tournaments = [];
    that.offset = 0;
    that.numOfParsedTournament = 0;

}


var prot = ConfigParser.prototype;

/**
 * 
 *
 *
 */
prot.parse = function () {
    var that;
    that = this;
    if (that.arrData) {
        return;
    }

    return that.arrData = that.rawData.replace(that.pattern, "\n").split('\n');
};

/**
 * 
 *
 *
 */
prot.parseNextNTournament = function (number, callback) {
    var cb, n, parseN, i, that;
    that = this;
    cb = callback || noop;
    n = number || 1;
    parseN = Math.min(n, that.numOfTournament - that.numOfParsedTournament);

    for (i = 0; i < parseN - 1; i += 1) {
        that.parseNextTournament(noop);
    }
    that.parseNextTournament(cb);
};


/**
 * 
 *
 *
 */
prot.getRawData = function () {
    return this.rawData;
};

/**
 * 
 *
 *
 */
prot.getNumOfTournament = function (callback) {
    var cb, that;
    that = this;
    cb = callback || noop;

    that.parse();

    if (that.numOfTournament) {
        return cb(null, that.numOfTournament);
    }

    that.nextInt(function (err, num) {
        if (err) {
            return cb(err, null);
        }
        that.numOfTournament = num;
        return cb(null, num);
    });
};

/**
 * 
 *
 *
 */
prot.getNthTournament = function (number, callback) {
    var cb, tournament, n, that;
    that = this;

    cb = callback || noop;
    n = Math.min(number, that.getNumOfTournament());

    tournament = that.tournaments[n];

    if (tournament) {
        return cb(null, tournament);
    } else {
        return that.parseNextNTournament(n - that.numOfParsedTournament, cb);
    }
};

/**
 * 
 *
 *
 */
prot.parseNextTournament = function (callback) {
    var cb, field, nRobotA, nRobotB, offset,
        parse, numOfParsedTournament, parsedTournament, that;
    that = this;
    cb = callback || noop;

    if (that.numOfParsedTournament > that.numOfTournament) {
        return cb(new Error("No more Tournament"), null);
    } else {
        that.parseTournamentConf(function (err, config) {
            if (err) {
                return cb(err, null);
            }

            offset = that.offset;
            that.parseTeams(config.nRobotA, config.nRobotB, offset, function (err, teams) {
                if (err) {
                    return cb(err, null);
                }

                that.offset += config.nRobotA + config.nRobotB;
                parsedTournament = {};
                parsedTournament.field = config.field;
                parsedTournament.robotsA = teams.robotsA;
                parsedTournament.robotsB = teams.robotsB;
                that.tournaments[that.numOfParsedTournament] = parsedTournament;
                that.numOfParsedTournament += 1;
                cb(null, parsedTournament);
            });
        });
    }
};

/**
 * 
 *
 *
 */
prot.parseTournamentConf = function (callback) {
    var conf, fn, cb, that;
    that = this;
    conf = {};
    cb = callback || noop;

    fn = function (name) {
        return function (err, data) {
            if (err) {
                return cb(new Error("There aren't enough tournament in config", null));
            }
            conf[name] = data;
        };
    };

    that.nextInt(fn("field"));
    that.nextInt(fn("nRobotA"));
    that.nextInt(fn("nRobotB"));

    cb(null, conf);
};

/**
 * 
 *
 *
 */
prot.parseTeams = function (nRobotA, nRobotB, from, callback) {
    var cb, to, that;
    that = this;
    cb = callback || noop;
    to = from + nRobotA + nRobotB;
    if (to > that.arrData.length) {
        return cb(new Error("There aren't enough robots"));
    }
    return cb(null, {"robotsA": that.parseRobot(nRobotA, from, cb), "robotsB": that.parseRobot(nRobotB, from + nRobotA, cb)});
};

/**
 * 
 *
 *
 */
prot.parseRobot = function (number, from, cb) {
    var n, start, robots, that;
    that = this;

    n = number || 0;
    start = from || that.offset;

    robots = that.arrData.slice(start, start + n).map(function (x) {
        var power;
        power = parseInt(x, 10);
        if ((power > 0) && (power < 101)) {
            return power;
        } else {
            cb(new Error('Invalid robot Power in config File: ', x));
        }
    });

    return robots;
};

/**
 * 
 *
 *
 */
prot.nextInt = function (callback) {
    var cb, number, that;
    that = this;
    cb = callback || noop;
    if (that.arrData.length < that.offset) {
        return cb(new Error("No more Int in config"), null);
    }

    that.offset += 1;
    number = parseInt(that.arrData[that.offset - 1], 10);
    if (isNaN(number)) {
        return cb(new Error("This is not an Integer"), null);
    }
    return cb(null, number);
};

var configParser = function(data) {
    var obj;
    obj = new ConfigParser(data);
    return obj
}


module.exports = configParser;