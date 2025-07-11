import { createLogger } from './logger.js';

const logger = createLogger();

export const validateEnvironment = () => {
    const requiredEnvVars = [
        'DISCORD_TOKEN',
        'DISCORD_CLIENT_ID',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_SEARCH_API_KEY',
        'GOOGLE_SEARCH_ENGINE_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        logger.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    logger.info('Environment validation passed ✅');
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>"\\/]/g, '')
        .trim()
        .substring(0, 255); // Limit length
};

export const validateFileSize = (size) => {
    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    return size <= MAX_SIZE;
};

export const validateFileName = (filename) => {
    // Check for valid filename
    const invalidChars = /[<>:"/\\|?*]/;
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    
    if (invalidChars.test(filename)) return false;
    if (reservedNames.includes(filename.toUpperCase())) return false;
    if (filename.length > 255) return false;
    
    return true;
};
