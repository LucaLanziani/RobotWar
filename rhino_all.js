'use strict';

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

    /**
     * Parse the input and return an array of strings
     */
    parse = function () {
        if (my.arrData) {
            return;
        }

        return my.arrData = data.replace(my.pattern, "\n").split('\n');
    };

    /**
     * Parse the next N tournament and return the Nth 
     */
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


    /**
     * Return the rawdata
     */
    getRawData = function () {
        return my.rawData;
    };

    /**
     * Return the number of tournament
     *
     */
    getNumOfTournament = function (callback) {
        var cb;
        cb = callback || noop;
        parse();

        if (my.numOfTournament) {
            return cb(null, my.numOfTournament);
        }

        nextInt(function (err, num) {
            if (err) {
                return cb(err, null);
            }
            my.numOfTournament = num;
            return cb(null, num);
        });
    };

    /**
     * Return the Nth tournament
     */
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

    /**
     * Parse the next tournament
     *
     */
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

    /**
     * Parse the tournament config (number of field, number of TeamA robots, number of TeamB robots)
     */
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

    /**
     * Parse the robots power for TeamA and TeamB
     *
     */
    parseTeams = function (nRobotA, nRobotB, from, callback) {
        var cb, to;
        cb = callback || noop;
        to = from + nRobotA + nRobotB;
        if (to > my.arrData.length) {
            return cb(new Error("There aren't enough robots"));
        }
 
        return cb(null, {"robotsA": parseRobot(nRobotA, from, cb), "robotsB": parseRobot(nRobotB, from + nRobotA, cb)});
    };

    /**
     * Parse and return robots power 
     * if some power is invalid, it call the callback with error
     *
     */
    parseRobot = function (number, from, cb) {
        var n, start, robots;

        n = number || 0;
        start = from || my.offset;

        robots = my.arrData.slice(start, start + n).map(function (x) {
            var power;
            power = parseInt(x, 10);
            if ((power > 0) && (power < 101)) {
                return power;
            } else {
                cb(new Error('Invalid robot Power in config File: '), null);
            }
        });

        return robots;
    };

    /**
     * Return next number in config
     */
    nextInt = function (callback) {
        var cb, number;
        cb = callback || noop;
        if (my.arrData.length < my.offset) {
            return cb(new Error("No more Int in config"), null);
        }

        my.offset += 1;
        number = parseInt(my.arrData[my.offset - 1], 10);
        if (isNaN(number)) {
            return cb(new Error("This is not an Integer"), null);
        }
        return cb(null, number);
    };

    that.getNumOfTournament = getNumOfTournament;
    that.getNthTournament = getNthTournament;
    that.getRawData = getRawData;
    return that;
};

/**
 * Return a tournament object
 * @param {Object} conf a configParser object
 * @param {Object} team a team object 
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

/**
 * Returns a team object
 *
 * @param {number[]} robots an array of robots power
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


/**
 *  Returns a war object
 *  
 *  @param {String} config config string
 *  @param {Object} configParser a configParser object
 *  @param {Object} tournament a tournamet object
 *  @param {Object} team a team object
 *
 */
var war = function (config, configParser, tournament, team) {
    var that, my, noop, complete, on, addTournament, prepare,
        formatOutput, startNth, start, startNewThread;

    that = {};
    my = {};

    my.rawConfig = config;
    my.configParser = configParser(config);
    my.tournamentNumber = 0;
    my.results = [];
    my.completed = 0;
    my.activeThread = 0;
    my.threadToStart = [];
    my.tournament = tournament;
    my.team = team;
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
     *  Check if all tournament are completed and fire the 'complete event'
     */
    complete = function () {
        my.completed += 1;

        if (my.completed === my.tournamentNumber) {
            my.onComplete.forEach(function (f) {
                f(null, my.results);
            });
        } else {
          //  startNewThread();
        }
    };

    /**
     *  Start the Nth tournament  
     *
     *  @param {number} n the number of tuornament to start
     */
    startNth = function (n, callback) {
        var runnable, thread, cb;

        cb = callback || noop;

        my.tournaments[n].on("complete", function (teamA, teamB) {
            my.results[n] = {"teamA": teamA, "teamB": teamB};
            return cb();
        });

        /*jslint undef: true */
        // runnable = new java.lang.Runnable(my.tournaments[n]);
        // thread = new java.lang.Thread(runnable);
        // return startNewThread(thread);
        return my.tournaments[n].start();
    };

    /**
     *  Emulate threadPool in rhino, if you want test it
     *  uncomment line 426, 482, 483, 484 and comment line 485 
     */
    startNewThread = function (thread) {
        if (thread) {
            if (my.activeThread < 2) {
                my.activeThread += 1;
                return thread.start();
            } else {
                return my.threadToStart.push(thread);
            }
        } else {
            my.activeThread -= 1;
            if (my.threadToStart.length > 0) {
                return startNewThread(my.threadToStart.pop());
            }
        }
    };


    /**
     *  Add a new tournament to the Array of tournaments
     *
     */
    addTournament = function (callback) {
        return function (err, conf) {
            if (err) {
                return callback(err, my.tournamentNumber);
            }
            my.tournamentNumber += 1;
            my.tournaments.push(my.tournament(conf, my.team));
        };
    };

    /**
     *  Prepare the war, setup the turnaments
     *
     */
    prepare = function (callback) {
        var i, cb, fn;
        cb = callback || noop;

        if (my.tournaments) {
            return cb(null, my.tournamentNumber);
        }

        my.tournaments = [];
        my.configParser.getNumOfTournament(function (err, number) {
            if (err) {
                return cb(err, null);
            }

            for (i = 0; i < number; i += 1) {
                my.configParser.getNthTournament(i, addTournament(cb));
            }

            return cb(null, my.tournamentNumber);
        });
    };

    /**
     *  Return an array for line
     *  
     *  @param {object} result the war result
     */
    formatOutput = function (results, callback) {
        var output = [];
        results.forEach(function (res) {
            var nRobotA, nRobotB;
            nRobotA = res.teamA.availableRobots();
            nRobotB = res.teamB.availableRobots();
            if ((nRobotA === 0) && (nRobotB === 0)) {
                output.push("team A and team B died");
            } else if (nRobotA === 0) {
                output.push("team B wins");
                output = output.concat(res.teamB.getRobots());
            } else {
                output.push("team A wins");
                output = output.concat(res.teamA.getRobots());
            }
        });
        callback(null, output);
    };

    /**
     *  Start the war
     *
     */
    start = function () {
        var i;

        for (i = 0; i < my.tournaments.length; i += 1) {
            startNth(i, complete);
        }
    };

    that.start = start;
    that.formatOutput = formatOutput;
    that.prepare = prepare;
    that.on = on;
    return that;
};

var robotwar = war(readFile(arguments[0]), configParser, tournament, team);    

robotwar.prepare(function (err, number) {
    if (err) {
        print(err);
        quit();
    } else {
        robotwar.on('complete', function (err, results) {
            robotwar.formatOutput(results, function (err, output) {
                print(output.join("\n"));
            });
        });
       
        robotwar.start();
    }
});