const winston = require('winston');
const {LOG_LEVEL} = process.env;
let alignColorsAndTime = function (loggerFile) {
    return winston.format.combine(
        winston.format.label({
            label: `[${loggerFile}]`
        }),
        winston.format.timestamp({format: "YY-MM-DD HH:mm:ss"}),
        winston.format.printf(info => ` ${info.label} [ ${info.level} ]  [ ${info.timestamp} ] : ${info.message}`));
}
module.exports.logger = function (loggerFile) {
    return winston.createLogger({
        level: LOG_LEVEL, transports: [//
            // - Write all logs with importance level of `error` or less to `error.log`
            // - Write all logs with importance level of `info` or less to `combined.log`
            //
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize({all: true}), alignColorsAndTime(loggerFile))
            }), new winston.transports.File({
                filename: 'log/myhome-scrapper.log', format: winston.format.combine(alignColorsAndTime(loggerFile))
            }),],
    })
}
