const config = require('./config');

class AutoBackup {
    constructor() {
        this.config = config;
        this.isRunning = false;
    }

    async start() {
        console.log(`Starting ${this.config.get('app.name')} v${this.config.get('app.version')}`);
        
        try {
            this.isRunning = true;
            await this.initialize();
            console.log('AutoBackup service started successfully');
        } catch (error) {
            console.error('Failed to start AutoBackup:', error.message);
            process.exit(1);
        }
    }

    async initialize() {
        console.log('Initializing backup service...');
        console.log(`Backup interval: ${this.config.get('backup.interval')}`);
        console.log(`Storage providers: ${this.config.get('storage.providers').join(', ')}`);
        console.log(`Default provider: ${this.config.get('storage.defaultProvider')}`);
    }

    async stop() {
        console.log('Stopping AutoBackup service...');
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