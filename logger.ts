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


const pino = require('pino');

module.exports = pino({});