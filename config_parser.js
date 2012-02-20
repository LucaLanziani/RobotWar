var configParser = function (data) {
    if (typeof data !== 'string') {
        throw new Error('config should be a string');
    }

    var that, my, parse, parseNextNTournament,
        getRawData, getNumOfTournament, getNthTournament,
        parseNextTournament, parseRobot, nextInt,
        parseTournamentConf, parseTeams, noop;

    that = {};
    my = {};

    my.rawData = data;
    my.pattern = / /g;
    my.tournaments = [];
    my.offset = 0;
    my.numOfParsedTournament = 0;
    
    noop = function () {};

    parse = function () {
        var fn;
        if (my.arrData) {
            return;
        }

        fn = function () {
            my.arrData = data.replace(my.pattern, "\n").split('\n');
        };

        return fn();
    };

    parseNextNTournament = function (number, callback) {
        var cb, n, parseN, i;
        cb = callback || noop;
        n = number || 1;
        parseN = Math.min(n, my.numOfTournament - my.numOfParsedTournament);

        for (i = 0; i < parseN - 1; i += 1) {
            parseNextTournament(noop);
        }
        parseNextTournament(cb);
    };

    getRawData = function () {
        return my.rawData;
    };

    getNumOfTournament = function (callback) {
        var cb;
        cb = callback || noop;
        parse();
        if (!my.numOfTournament) {
            nextInt(function (err, int) {
                if (err) {
                    return  cb(err, null);
                }
                my.numOfTournament = int;
                return cb(null, int);
            });
        }
        return cb(null, my.numOfTournament);
    };

    getNthTournament = function (number, callback) {
        var cb, tournament, n;

        cb = callback || noop;
        n = Math.min(number, getNumOfTournament());

        tournament = my.tournaments[n];

        if (tournament) {
            return cb(null, tournament);
        } else {
            return parseNextNTournament(n - my.numOfParsedTournament, cb);
        }
    };

    parseNextTournament = function (callback) {
        var cb, field, nRobotA, nRobotB, offset,
            parse, numOfParsedTournament, parsedTournament;

        cb = callback || noop;

        if (my.numOfParsedTournament > my.numOfTournament) {
            return cb(new Error("No more Tournament"), null);
        } else {
            parseTournamentConf(function (err, config) {
                if (err) {
                    return cb(err, null);
                }

                offset = my.offset;
                parseTeams(config.nRobotA, config.nRobotB, offset, function (err, teams) {
                    if (err) {
                        return cb(err, null);
                    }

                    my.offset += config.nRobotA + config.nRobotB;
                    parsedTournament = {};
                    parsedTournament.field = config.field;
                    parsedTournament.robotsA = teams.robotsA;
                    parsedTournament.robotsB = teams.robotsB;
                    my.tournaments[my.numOfParsedTournament] = parsedTournament;
                    my.numOfParsedTournament += 1;
                    cb(null, parsedTournament);
                });
            });
        }
    };

    parseTournamentConf = function (callback) {
        var conf, fn, cb;
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

        nextInt(fn("field"));
        nextInt(fn("nRobotA"));
        nextInt(fn("nRobotB"));

        cb(null, conf);
    };

    parseTeams = function (nRobotA, nRobotB, from, callback) {
        var cb, to;
        cb = callback || noop;
        to = from + nRobotA + nRobotB;
        if (to > my.arrData.length) {
           return cb(new Error("There aren't enough robots"));
        }
        
        return cb(null, {"robotsA": parseRobot(nRobotA, from, cb), "robotsB": parseRobot(nRobotB, from + nRobotA, cb)});
    };

    parseRobot = function (number, from, cb) {
        var n, start;

        n = number || 0;
        start = from || my.offset;

        robots = my.arrData.slice(start, start + n).map(function (x) {
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

    nextInt = function (callback) {
        var cb;
        cb = callback || noop;

        if (my.arrData.length < my.offset) {
            return cb(new Error("No more Int in config"), null);
        }

        my.offset += 1;
        return cb(null, parseInt(my.arrData[my.offset - 1], 10));
    };

    that.getNumOfTournament = getNumOfTournament;
    that.getNthTournament = getNthTournament;
    that.getRawData = getRawData;
    return that;
};

module.exports = configParser;