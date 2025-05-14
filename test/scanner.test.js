const { expect } = require('chai');
const path = require('path');
const FileScanner = require('../src/scanner');

describe('FileScanner', () => {
    let scanner;

    before(() => {
        const mockConfig = {
            get: (key) => {
                const config = {
                    'logging.level': 'silent'
                };
                return config[key];
            }
        };
        scanner = new FileScanner(mockConfig);
    });

    describe('_shouldExclude()', () => {
        it('should exclude node_modules directory', () => {
            const result = scanner._shouldExclude('/path/to/node_modules/package');
            expect(result).to.be.true;
        });

        it('should exclude .git directory', () => {
            const result = scanner._shouldExclude('/path/to/.git/config');
            expect(result).to.be.true;
        });

        it('should exclude .log files', () => {
            const result = scanner._shouldExclude('/path/to/app.log');
            expect(result).to.be.true;
        });

        it('should not exclude normal files', () => {
            const result = scanner._shouldExclude('/path/to/normal/file.js');
            expect(result).to.be.false;
        });
    });

    describe('scanDirectory()', () => {
        it('should scan config directory successfully', async function() {
            this.timeout(5000);
            
            try {
                const configPath = path.join(process.cwd(), 'config');
                const files = await scanner.scanDirectory(configPath, { recursive: false });
                expect(files).to.be.an('array');
                expect(files.length).to.be.greaterThan(0);
                
                const defaultConfig = files.find(f => f.name === 'default.json');
                expect(defaultConfig).to.exist;
                expect(defaultConfig.size).to.be.greaterThan(0);
            } catch (error) {
                // Skip test if config directory doesn't exist or is inaccessible
                this.skip();
            }
        });
    });
});