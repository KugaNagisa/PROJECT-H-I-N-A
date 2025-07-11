import { Events } from 'discord.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        
        // Set bot presence
        client.user.setPresence({
            activities: [{
                name: 'helping with Google Drive 💖',
                type: 0 // Playing
            }],
            status: 'online'
        });

        // Log startup information
        logger.info('Bot Statistics', {
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            channels: client.channels.cache.size,
            commands: client.commands.size
        });

        console.log(`${colors.magenta}
 ██╗  ██╗██╗███╗   ██╗ █████╗     ██████╗  ██████╗ ████████╗
 ██║  ██║██║████╗  ██║██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
 ███████║██║██╔██╗ ██║███████║    ██████╔╝██║   ██║   ██║
 ██╔══██║██║██║╚██╗██║██╔══██║    ██╔══██╗██║   ██║   ██║
 ██║  ██║██║██║ ╚████║██║  ██║    ██████╔╝╚██████╔╝   ██║
 ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝
${colors.reset}
${colors.cyan}            🤖 Cute Discord Bot 💖
${colors.yellow}         Made with ❤️ Kuga Nagisa
${colors.reset}
 ✨ Bot Status: ONLINE | Guilds: ${client.guilds.cache.size} | Users: ${client.users.cache.size} | Commands: ${client.commands.size}
 🚀 Features: Google Drive • Web Search • Interactive UI
        `);
    }
};
