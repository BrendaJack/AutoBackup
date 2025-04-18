const winston = require('winston');
const path = require('path');
const config = require('./config');

const logLevel = config.get('logging.level') || 'info';
const logFile = config.get('logging.file') || 'logs/app.log';

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
        })
    ),
    transports: [
        new winston.transports.File({
            filename: path.resolve(logFile),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level}]: ${message}`;
                })
            )
        })
    ]
});

module.exports = logger;