"use strict";

/** required libraries */
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const path = require('path');

/** set environment variables */
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/** configure AWS CloudWatch region */
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

/** create Winston logger and transporter(s) */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: process.env.LOG_SERVICE },
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, `/logs/${process.env.LOG_NAME}_error.log`), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, `/logs/${process.env.LOG_NAME}_combined.log`) }),
        new WinstonCloudWatch({
            logGroupName: process.env.LOG_GROUP,
            logStreamName: process.env.LOG_STREAM
        })
    ]
});

/** production formatting adjustments */
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;