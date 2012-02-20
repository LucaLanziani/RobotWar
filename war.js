'use strict';

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
    my.tournamentNumber = my.configParser.getNumOfTournament();
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
        prepare();

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
                return callback(err, null);
            }
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
            return cb(null);
        }

        my.tournaments = [];
        my.configParser.getNumOfTournament(function (err, number) {
            if (err) {
                return cb(err, null);
            }

            my.tournamentNumber = number;
            for (i = 0; i < my.tournamentNumber; i += 1) {
                my.configParser.getNthTournament(i, addTournament(cb));
            }
        });
        cb(null, my.tournaments);
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

module.exports = war;