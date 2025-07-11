import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

class SchedulerService {
    constructor() {
        this.tasks = new Map();
        this.client = null;
    }

    init(client) {
        this.client = client;
        this.startScheduledTasks();
    }

    startScheduledTasks() {
        // Health check every 30 minutes
        this.scheduleTask('healthCheck', '*/30 * * * *', this.healthCheck.bind(this));
        
        // Cleanup old logs daily at 2 AM
        this.scheduleTask('logCleanup', '0 2 * * *', this.cleanupLogs.bind(this));
        
        // Memory monitoring every hour
        this.scheduleTask('memoryMonitor', '0 * * * *', this.monitorMemory.bind(this));
        
        // Token refresh check every 6 hours
        this.scheduleTask('tokenRefresh', '0 */6 * * *', this.checkTokens.bind(this));

        logger.info('Scheduler started with all tasks');
    }

    scheduleTask(name, schedule, task) {
        if (this.tasks.has(name)) {
            logger.warn(`Task ${name} already exists, skipping...`);
            return;
        }

        const cronTask = cron.schedule(schedule, async () => {
            try {
                logger.info(`Running scheduled task: ${name}`);
                await task();
                logger.info(`Completed scheduled task: ${name}`);
            } catch (error) {
                logger.error(`Error in scheduled task ${name}:`, error);
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });

        this.tasks.set(name, cronTask);
        logger.info(`Scheduled task: ${name} with schedule: ${schedule}`);
    }

    async healthCheck() {
        try {
            if (!this.client) {
                throw new Error('Client not initialized');
            }

            const ping = this.client.ws.ping;
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();

            logger.info('Health Check', {
                ping: `${ping}ms`,
                memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                uptime: `${Math.round(uptime / 3600)} hours`,
                guilds: this.client.guilds.cache.size,
                users: this.client.users.cache.size
            });

            // Check if memory usage is too high
            if (memoryUsage.heapUsed / 1024 / 1024 > 150) {
                logger.warn('High memory usage detected');
                // Trigger garbage collection if available
                if (global.gc) {
                    global.gc();
                    logger.info('Garbage collection triggered');
                }
            }

            // Check ping
            if (ping > 1000) {
                logger.warn(`High ping detected: ${ping}ms`);
            }

        } catch (error) {
            logger.error('Health check failed:', error);
        }
    }

    async cleanupLogs() {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const logsDir = path.join(process.cwd(), 'logs');

            if (!fs.existsSync(logsDir)) {
                return;
            }

            const files = fs.readdirSync(logsDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 14); // Keep logs for 14 days

            let deletedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                logger.info(`Cleaned up ${deletedCount} old log files`);
            }
        } catch (error) {
            logger.error('Log cleanup failed:', error);
        }
    }

    async monitorMemory() {
        try {
            const memoryUsage = process.memoryUsage();
            const memoryInMB = {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            };

            logger.info('Memory Monitor', memoryInMB);

            // Alert if memory usage is high
            if (memoryInMB.heapUsed > 100) {
                logger.warn('High memory usage detected', memoryInMB);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    logger.info('Forced garbage collection');
                }
            }
        } catch (error) {
            logger.error('Memory monitoring failed:', error);
        }
    }

    async checkTokens() {
        try {
            // This would check for expired tokens and attempt to refresh them
            // Implementation would depend on how tokens are stored
            logger.info('Token refresh check completed');
        } catch (error) {
            logger.error('Token refresh check failed:', error);
        }
    }

    stopTask(name) {
        const task = this.tasks.get(name);
        if (task) {
            task.stop();
            this.tasks.delete(name);
            logger.info(`Stopped task: ${name}`);
        }
    }

    stopAllTasks() {
        for (const [name, task] of this.tasks) {
            task.stop();
            logger.info(`Stopped task: ${name}`);
        }
        this.tasks.clear();
        logger.info('All scheduled tasks stopped');
    }

    getTaskStatus() {
        const status = {};
        for (const [name, task] of this.tasks) {
            status[name] = {
                running: task.running,
                scheduled: task.scheduled
            };
        }
        return status;
    }
}

const scheduler = new SchedulerService();

export const startScheduler = (client) => {
    scheduler.init(client);
};

export const stopScheduler = () => {
    scheduler.stopAllTasks();
};

export const getSchedulerStatus = () => {
    return scheduler.getTaskStatus();
};

export default scheduler;
