# AutoBackup

A simple automated backup tool for personal file management.

## Features

- Automated file scanning and backup
- Configurable backup intervals 
- Multiple storage provider support (planned)
- Comprehensive logging
- Error handling and recovery

## Getting Started

### Installation

```bash
npm install
```

### Configuration

Edit `config/default.json` to customize backup settings:

```json
{
  "backup": {
    "interval": "0 2 * * *",
    "maxRetries": 3
  }
}
```

### Usage

```bash
npm start
```

## Project Structure

```
src/
  ├── index.js      # Main application entry
  ├── config.js     # Configuration management  
  ├── logger.js     # Logging system
  ├── scanner.js    # File scanning utilities
  └── backup.js     # Backup operations
config/
  └── default.json  # Default configuration
```

## License

MIT