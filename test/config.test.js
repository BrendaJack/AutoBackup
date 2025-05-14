const { expect } = require('chai');
const path = require('path');

describe('ConfigManager', () => {
    let ConfigManager;

    before(() => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        ConfigManager = require('../src/config');
    });

    describe('get()', () => {
        it('should return app name from config', () => {
            const appName = ConfigManager.get('app.name');
            expect(appName).to.equal('AutoBackup');
        });

        it('should return app port from config', () => {
            const port = ConfigManager.get('app.port');
            expect(port).to.be.a('number');
            expect(port).to.equal(3000);
        });

        it('should return undefined for non-existent key', () => {
            const result = ConfigManager.get('non.existent.key');
            expect(result).to.be.undefined;
        });
    });

    describe('set()', () => {
        it('should set a new config value', () => {
            ConfigManager.set('test.value', 'hello');
            const result = ConfigManager.get('test.value');
            expect(result).to.equal('hello');
        });

        it('should update existing config value', () => {
            ConfigManager.set('app.port', 4000);
            const result = ConfigManager.get('app.port');
            expect(result).to.equal(4000);
        });
    });
});