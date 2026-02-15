// notifications.js

const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Setup logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'audit.log' })
    ]
});

// Rate limiter to prevent email spam
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // Limit each IP to 5 requests per windowMs
});

// Email sender setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

// Function to validate boolean settings
const isValidBoolean = (value) => typeof value === 'boolean';

// Sample function to send an email
const sendEmail = async (emailOptions) => {
    try {
        // Validate input settings
        if (!isValidBoolean(emailOptions.someBooleanSetting)) {
            throw new Error('Invalid boolean setting');
        }

        const info = await transporter.sendMail(emailOptions);
        logger.info(`Email sent: ${info.response}`);
    } catch (error) {
        logger.error(`Error sending email: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail, emailLimiter };