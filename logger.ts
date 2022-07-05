// // import * as pino from "pino";
// import pino from "pino";
// // import { APP_ID, LOG_LEVEL } from "./Config";
//
// const logger = pino({
//     name: 'mitel-ldap-proxy',
//     level: 'debug'
// });
//
// module.exports = {
//     logger,
// };


const pino = require("pino");

module.exports = pino({
    name: "mitel-ldap-proxy",
    level: "trace",
    transport: {
        // TODO: It is NOT recommended to use this, as it destroys structured logging.
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "time,pid,hostname",
            //ignore: 'pid,hostname',
        }
    },
});