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

/**
 * 
 *
 *
 */
ConfigParser.prototype.parse = function () {
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
ConfigParser.prototype.parseNextNTournament = function (number, callback) {
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
ConfigParser.prototype.getRawData = function () {
    return this.rawData;
};

/**
 * 
 *
 *
 */
ConfigParser.prototype.getNumOfTournament = function (callback) {
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
ConfigParser.prototype.getNthTournament = function (number, callback) {
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
ConfigParser.prototype.parseNextTournament = function (callback) {
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
ConfigParser.prototype.parseTournamentConf = function (callback) {
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
ConfigParser.prototype.parseTeams = function (nRobotA, nRobotB, from, callback) {
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
ConfigParser.prototype.parseRobot = function (number, from, cb) {
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
ConfigParser.prototype.nextInt = function (callback) {
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


/**
 * Returns a team object
 *
 * @param 
 */
var Team = function (robots) {
    var that = this;

    that.robots = robots || [];
}


Team.prototype.sort = function () {
    var that = this;
    that.robots = that.robots.sort(function (a, b) { return b - a; });
};

/**
 * Adds new robots to the team and sort it
 * 
 * @param {number[]} robots Array of power
 */
Team.prototype.addRobots = function (robots) {
    var that = this;
    var toAdd = robots.filter(function (x) { return (x > 0 && x < 101); });

    that.robots = that.robots.concat(toAdd);
    that.sort();
};

/**
 * Returns the number of available robots
 */
Team.prototype.availableRobots = function () {
    return this.robots.length;
};

/**
 * Returns N robots and removes them from the team
 *
 * @param {number} number The number of robots to remove
 */
Team.prototype.takeNRobots = function (number) {
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
Team.prototype.getRobots = function () {
    return this.robots;
};


var team = function(robots) {
    var obj;
    obj = new Team(robots);
    obj.sort();
    return obj;
}


var Tournament = function (conf, team) {
    var that;
    that = this;

    that.field = conf.field;
    that.teamA = team(conf.robotsA);
    that.teamB = team(conf.robotsB);
    that.onComplete = [];
}


/**
 * Adds a listener 
 * @param {string} event Event name
 * @param {function} cb Function to call on event
 */
Tournament.prototype.on = function (event, cb) {
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
Tournament.prototype.fight = function (robots, callback) {
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
Tournament.prototype.match = function (callback) {
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
Tournament.prototype.notAWinner = function () {
    return ((this.teamA.availableRobots() > 0) && (this.teamB.availableRobots() > 0));
};

/**
 * Start a tournament
 */
Tournament.prototype.start = function (callback) {
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


/** 
 * Create a war object
 *
 * @return { Object }
 * @param {String} config Config string
 * @param configParser configParser Object
 * @param tournament tournament Object
 * @param team team Object
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
     * Check if all tournament are completed and fire the 'complete event'
     * 
     *
     */
    complete = function () {
        my.completed += 1;

        if (my.completed === my.tournamentNumber) {
            my.onComplete.forEach(function (f) {
                f(null, my.results);
            });
        } else {
            startNewThread();
        }
    };

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

    startNth = function (n, callback) {
        var runnable, thread, cb;

        cb = callback || noop;

        // my.tournaments[n].on("complete", function () {
        //     console.log("completed tournament: ",n);
        // }); 

        my.tournaments[n].on("complete", function (teamA, teamB) {
            my.results[n] = {"teamA": teamA, "teamB": teamB};
            return cb();
        });

        /*jslint undef: true */
        // runnable = new java.lang.Runnable(my.tournaments[n]);
        // thread = new java.lang.Thread(runnable);
        // startNewThread(thread);
        return my.tournaments[n].start();
    };

    start = function () {
        var i;

        for (i = 0; i < my.tournaments.length; i += 1) {
            startNth(i, complete);
        }
    };

    /**
     * 
     *
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
     * 
     *
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
     * 
     *
     *
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