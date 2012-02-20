'use strict';
var team = require('./team.js'),
    tournament = require('./tournament.js'),
    configParser = require('./config_parser.js'),
    war = require('./war.js'),
    fs = require('fs');


var war1 = war(fs.readFileSync(process.argv[2]).toString(), configParser, tournament, team);

war1.prepare(function (err, number) {
    if (err) {
        console.log(err);
        console.log("parsed", number);
        process.exit();
    } else {
        war1.on('complete', function (err, results) {
            war1.formatOutput(results, function (err, output) {
                console.log(output.join("\n"));
            });
        });

        war1.start();
    }
});