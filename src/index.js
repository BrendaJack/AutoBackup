const config = require('./config');
const logger = require('./logger');

class AutoBackup {
    constructor() {
        this.config = config;
        this.logger = logger;
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
    }

    async stop() {
        this.logger.info('Stopping AutoBackup service...');
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