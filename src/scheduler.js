const cron = require('node-cron');
const logger = require('./logger');

class TaskScheduler {
    constructor(config, backupManager) {
        this.config = config;
        this.backupManager = backupManager;
        this.logger = logger;
        this.scheduledTasks = new Map();
    }

    scheduleBackup(name, cronExpression, sourcePaths, options = {}) {
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        this.logger.info(`Scheduling backup '${name}' with expression: ${cronExpression}`);

        const task = cron.schedule(cronExpression, async () => {
            this.logger.info(`Running scheduled backup: ${name}`);
            await this._executeBackup(name, sourcePaths, options);
        }, {
            scheduled: false,
            timezone: options.timezone || 'UTC'
        });

        this.scheduledTasks.set(name, {
            task,
            cronExpression,
            sourcePaths,
            options,
            lastRun: null,
            status: 'scheduled'
        });

        return task;
    }

    async _executeBackup(name, sourcePaths, options) {
        const taskInfo = this.scheduledTasks.get(name);
        if (taskInfo) {
            taskInfo.status = 'running';
            taskInfo.lastRun = new Date();
        }

        try {
            for (const sourcePath of sourcePaths) {
                this.logger.info(`Backing up ${sourcePath} for task ${name}`);
                const result = await this.backupManager.createBackup(sourcePath, options);
                this.logger.info(`Backup completed: ${result.id} (${result.fileCount} files)`);
            }

            if (taskInfo) {
                taskInfo.status = 'completed';
            }
        } catch (error) {
            this.logger.error(`Scheduled backup '${name}' failed:`, error);
            if (taskInfo) {
                taskInfo.status = 'failed';
                taskInfo.lastError = error.message;
            }
        }
    }

    startTask(name) {
        const taskInfo = this.scheduledTasks.get(name);
        if (!taskInfo) {
            throw new Error(`Task '${name}' not found`);
        }

        taskInfo.task.start();
        taskInfo.status = 'running';
        this.logger.info(`Started scheduled task: ${name}`);
    }

    stopTask(name) {
        const taskInfo = this.scheduledTasks.get(name);
        if (!taskInfo) {
            throw new Error(`Task '${name}' not found`);
        }

        taskInfo.task.stop();
        taskInfo.status = 'stopped';
        this.logger.info(`Stopped scheduled task: ${name}`);
    }

    startAll() {
        this.logger.info('Starting all scheduled tasks');
        for (const [name, taskInfo] of this.scheduledTasks) {
            try {
                this.startTask(name);
            } catch (error) {
                this.logger.error(`Failed to start task '${name}':`, error);
            }
        }
    }

    stopAll() {
        this.logger.info('Stopping all scheduled tasks');
        for (const [name] of this.scheduledTasks) {
            try {
                this.stopTask(name);
            } catch (error) {
                this.logger.error(`Failed to stop task '${name}':`, error);
            }
        }
    }

    getTaskStatus() {
        const status = {};
        for (const [name, taskInfo] of this.scheduledTasks) {
            status[name] = {
                cronExpression: taskInfo.cronExpression,
                status: taskInfo.status,
                lastRun: taskInfo.lastRun,
                lastError: taskInfo.lastError
            };
        }
        return status;
    }

    removeTask(name) {
        const taskInfo = this.scheduledTasks.get(name);
        if (taskInfo) {
            taskInfo.task.destroy();
            this.scheduledTasks.delete(name);
            this.logger.info(`Removed scheduled task: ${name}`);
        }
    }
}

module.exports = TaskScheduler;