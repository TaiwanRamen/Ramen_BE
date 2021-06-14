const log4js = require('log4js');

log4js.configure({
    appenders:{
        std: { type: "stdout", level: "all", layout:{type: "basic", } },
        file: { type: "file", filename: "logs/app.log", encoding: "utf-8", maxLogSize: 20000000, backups: 10 }
    },
    categories: {
        default: {appenders: ["std"], level: "debug"},
        ramenClub: {appenders: ["std", "file"], level: "all"}
    }
});

module.exports = log4js.getLogger("ramenClub");
