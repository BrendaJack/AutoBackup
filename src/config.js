const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../config');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const defaultConfig = this.loadJsonFile('default.json');
            const envConfig = this.loadEnvConfig();
            
            return { ...defaultConfig, ...envConfig };
        } catch (error) {
            console.error('Failed to load configuration:', error.message);
            process.exit(1);
        }
    }

    loadJsonFile(filename) {
        const filePath = path.join(this.configPath, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Config file not found: ${filename}`);
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }

    loadEnvConfig() {
        return {
            app: {
                port: process.env.PORT || this.config?.app?.port || 3000
            },
            backup: {
                interval: process.env.BACKUP_INTERVAL || this.config?.backup?.interval
            }
        };
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}

module.exports = new ConfigManager();