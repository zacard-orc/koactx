import path from 'path';
import dayjs from 'dayjs'

import  { createLogger, transports, format } from 'winston'

import { isDev } from './utils';

const loggerLevel:string = 'debug'
const loggerMaxFiles:number = 10
const loggerMaxsize:number = 10485760

const fmtBase = [
    format.splat(),
    format.timestamp({
        format: () => dayjs().format('YYYY-MM-DD HH:mm:ss:SSS'),
    }),
    format.printf((info) => {
        return `${info.timestamp} [${info.level}] ${info.message}`;
    }),
];

const lyFormatFile = format.combine(
    ...fmtBase,
);

if(isDev){
    fmtBase.unshift(
        format.colorize()
    );
}

const lyFormat = format.combine(
    ...fmtBase,
);

const lyTransports = {
    app: new transports.File({
        filename: path.resolve(__dirname, 'logs', 'app.log'),
        maxFiles: loggerMaxFiles,
        maxsize: loggerMaxsize,
        level: loggerLevel,
        format: lyFormatFile,
    }),
    exception: new transports.File({
        filename: path.resolve(__dirname, 'logs', 'exception.log'),
        maxFiles: loggerMaxFiles,
        maxsize: loggerMaxsize,
        level: loggerLevel,
        format: lyFormatFile,
    }),
    console: new transports.Console({
        level: 'debug',
        format: lyFormat,
    }),
};

const logger = createLogger({
    transports: [lyTransports.app, lyTransports.console],
    exceptionHandlers: [lyTransports.exception],
});

export default logger;