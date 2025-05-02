const config = require('./config');
const logger = require('./logger');
const BackupManager = require('./backup');
const TaskScheduler = require('./scheduler');

class AutoBackup {
    constructor() {
        this.config = config;
        this.logger = logger;
        this.backupManager = new BackupManager(config);
        this.scheduler = new TaskScheduler(config, this.backupManager);
        this.isRunning = false;
    }

    async start() {
        this.logger.info(`Starting ${this.config.get('app.name')} v${this.config.get('app.version')}`);
        
        try {
            this.isRunning = true;
            await this.initialize();
            this.logger.info('AutoBackup service started successfully');
        } catch (error) {
            this.logger.error('Failed to start AutoBackup:', error);
            process.exit(1);
        }
    }

    async initialize() {
        this.logger.info('Initializing backup service...');
        this.logger.info(`Backup interval: ${this.config.get('backup.interval')}`);
        this.logger.info(`Storage providers: ${this.config.get('storage.providers').join(', ')}`);
        this.logger.info(`Default provider: ${this.config.get('storage.defaultProvider')}`);
        
        // Setup default backup schedule
        this.setupDefaultSchedule();
        
        // Test backup functionality
        if (process.env.NODE_ENV !== 'production') {
            this.logger.info('Running backup test...');
            try {
                const testBackup = await this.backupManager.createBackup('./config');
                this.logger.info(`Test backup completed: ${testBackup.id}`);
            } catch (error) {
                this.logger.warn('Test backup failed:', error.message);
            }
        }
    }

    setupDefaultSchedule() {
        const interval = this.config.get('backup.interval');
        const defaultPaths = ['./config', './src'];
        
        this.scheduler.scheduleBackup('default-backup', interval, defaultPaths, {
            recursive: true,
            maxDepth: 5
        });
        
        this.scheduler.startTask('default-backup');
        this.logger.info('Default backup schedule configured');
    }

    async stop() {
        this.logger.info('Stopping AutoBackup service...');
        this.scheduler.stopAll();
        this.isRunning = false;
    }
}

const app = new AutoBackup();

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await app.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await app.stop();
    process.exit(0);
});

if (require.main === module) {
    app.start();
}

module.exports = AutoBackup;