const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const FileScanner = require('./scanner');

class BackupManager {
    constructor(config) {
        this.config = config;
        this.logger = logger;
        this.scanner = new FileScanner(config);
        this.backupHistory = [];
    }

    async createBackup(sourcePath, options = {}) {
        const backupId = this._generateBackupId();
        const timestamp = new Date().toISOString();
        
        this.logger.info(`Starting backup ${backupId} from ${sourcePath}`);

        try {
            const files = await this.scanner.scanDirectory(sourcePath);
            const backupPath = await this._createBackupDirectory(backupId);
            
            const result = await this._copyFiles(files, sourcePath, backupPath);
            
            const backupInfo = {
                id: backupId,
                timestamp,
                sourcePath,
                backupPath,
                fileCount: result.successful,
                totalSize: result.totalSize,
                status: 'completed',
                errors: result.errors
            };

            this.backupHistory.push(backupInfo);
            this.logger.info(`Backup ${backupId} completed: ${result.successful} files, ${this._formatSize(result.totalSize)}`);
            
            if (result.errors.length > 0) {
                this.logger.warn(`Backup ${backupId} had ${result.errors.length} errors`);
            }

            return backupInfo;
        } catch (error) {
            this.logger.error(`Backup ${backupId} failed:`, error);
            throw error;
        }
    }

    async _createBackupDirectory(backupId) {
        const backupPath = path.join(process.cwd(), 'backups', backupId);
        await fs.mkdir(backupPath, { recursive: true });
        return backupPath;
    }

    async _copyFiles(files, sourcePath, backupPath) {
        let successful = 0;
        let totalSize = 0;
        const errors = [];

        for (const file of files) {
            try {
                const relativePath = path.relative(sourcePath, file.path);
                const targetPath = path.join(backupPath, relativePath);
                
                await fs.mkdir(path.dirname(targetPath), { recursive: true });
                await fs.copyFile(file.path, targetPath);
                
                successful++;
                totalSize += file.size;
            } catch (error) {
                errors.push({
                    file: file.path,
                    error: error.message
                });
                this.logger.warn(`Failed to copy ${file.path}:`, error.message);
            }
        }

        return { successful, totalSize, errors };
    }

    _generateBackupId() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
        return `backup-${dateStr}`;
    }

    _formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    getBackupHistory() {
        return this.backupHistory;
    }
}

module.exports = BackupManager;