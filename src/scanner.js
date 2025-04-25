const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class FileScanner {
    constructor(config) {
        this.config = config;
        this.logger = logger;
        this.excludePatterns = [
            /node_modules/,
            /\.git/,
            /\.DS_Store/,
            /\.tmp$/,
            /\.log$/
        ];
    }

    async scanDirectory(dirPath, options = {}) {
        const { recursive = true, maxDepth = 10 } = options;
        
        try {
            const files = [];
            await this._scanRecursive(dirPath, files, 0, maxDepth, recursive);
            
            this.logger.info(`Scanned ${dirPath}, found ${files.length} files`);
            return files;
        } catch (error) {
            this.logger.error(`Failed to scan directory ${dirPath}:`, error);
            throw error;
        }
    }

    async _scanRecursive(dirPath, files, currentDepth, maxDepth, recursive) {
        if (currentDepth > maxDepth) {
            return;
        }

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (this._shouldExclude(fullPath)) {
                    continue;
                }

                if (entry.isDirectory() && recursive) {
                    await this._scanRecursive(fullPath, files, currentDepth + 1, maxDepth, recursive);
                } else if (entry.isFile()) {
                    const stat = await fs.stat(fullPath);
                    files.push({
                        path: fullPath,
                        name: entry.name,
                        size: stat.size,
                        modified: stat.mtime,
                        type: path.extname(entry.name)
                    });
                }
            }
        } catch (error) {
            this.logger.warn(`Failed to read directory ${dirPath}:`, error.message);
        }
    }

    _shouldExclude(filePath) {
        return this.excludePatterns.some(pattern => pattern.test(filePath));
    }

    async getFileInfo(filePath) {
        try {
            const stat = await fs.stat(filePath);
            return {
                path: filePath,
                name: path.basename(filePath),
                size: stat.size,
                modified: stat.mtime,
                type: path.extname(filePath),
                isDirectory: stat.isDirectory()
            };
        } catch (error) {
            this.logger.error(`Failed to get file info for ${filePath}:`, error);
            throw error;
        }
    }
}

module.exports = FileScanner;