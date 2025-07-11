# Hina Bot V2 - Comprehensive Discord Bot

A powerful Discord bot with Google Drive integration and web search capabilities with interactive UI components.

## 🌟 Features

### 🗂️ Google Drive Integration
- **OAuth2 Authentication**: Secure per-user authentication
- **File Management**: Upload, download, share, and delete files
- **Interactive File Manager**: Breadcrumb navigation, folder browsing
- **Auto-categorization**: Smart folder organization (Images, Documents, Archives)
- **File Sharing**: Generate public links with QR codes
- **Storage Management**: Monitor storage usage and quotas

### 🔍 Web Search
- **Multi-type Search**: Web, images, news, videos, documents
- **Rich Results**: Thumbnails, descriptions, metadata
- **Interactive Components**: Select menus, action buttons
- **Safe Search**: Content filtering and validation

### 🛠️ Utility Commands
- **Ping**: Latency monitoring with detailed metrics
- **Stats**: Bot statistics, memory usage, uptime
- **Help**: Interactive help system with categories

### 🎨 Interactive Features
- **Button Interactions**: File actions, navigation, confirmations
- **Select Menus**: Search types, help categories
- **Dynamic UI**: Context-aware components
- **Responsive Design**: Mobile-friendly layouts

## 🚀 Installation

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Bot Token
- Google Cloud Platform account

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hina-bot-v2.git
   cd hina-bot-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_GUILD_ID=your_test_guild_id
   
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
   
   GOOGLE_SEARCH_API_KEY=your_google_search_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id
   
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

4. **Deploy Commands**
   ```bash
   npm run deploy-commands
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

## 📚 Commands

### Google Drive Commands
- `/gdrive link` - Connect to Google Drive
- `/gdrive unlink` - Disconnect from Google Drive
- `/gdrive status` - Check connection status
- `/gdrive verify <code>` - Verify OAuth code
- `/gdrive upload <file>` - Upload file (max 8MB)
- `/gdrive download <filename>` - Download file
- `/gdrive list [folder]` - List files with interactive manager
- `/gdrive share <filename>` - Share file publicly
- `/gdrive delete <filename>` - Delete file

### Search Commands
- `/search <query> [type] [limit]` - Search web with various types

### Utility Commands
- `/ping` - Check bot latency
- `/help` - Interactive help system
- `/stats` - Bot statistics

## 🔧 Configuration

### API Setup

#### Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Add bot and get token
4. Enable necessary intents

#### Google Cloud Platform
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth2 credentials
4. Set up Custom Search API (optional)

### Environment Variables
- `DISCORD_TOKEN`: Discord bot token
- `DISCORD_CLIENT_ID`: Discord application ID
- `DISCORD_GUILD_ID`: Test guild ID (optional)
- `GOOGLE_CLIENT_ID`: Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth2 client secret
- `GOOGLE_SEARCH_API_KEY`: Google Custom Search API key
- `GOOGLE_SEARCH_ENGINE_ID`: Custom Search Engine ID
- `ENCRYPTION_KEY`: 32-character encryption key
- `LOG_LEVEL`: Logging level (default: info)

## 🏗️ Architecture

### Project Structure
```
hina-bot-v2/
├── commands/           # Slash commands
├── events/             # Discord events
├── handlers/           # Interaction handlers
├── services/           # Core services
├── utils/              # Utility functions
├── logs/               # Log files
├── .vscode/            # VS Code configuration
├── index.js            # Main entry point
├── deploy-commands.js  # Command deployment
└── package.json        # Dependencies
```

### Core Services
- **Google Drive Service**: OAuth2, file operations, folder management
- **Search Service**: Google Custom Search integration
- **Scheduler Service**: Background tasks, health monitoring

### Security Features
- **Token Encryption**: All credentials encrypted at rest
- **Input Validation**: Sanitization and validation
- **Rate Limiting**: Command cooldowns and API limits
- **Permission Checks**: User-specific actions
- **Error Handling**: Comprehensive error recovery

## 🎯 Development

### Scripts
- `npm start` - Start the bot
- `npm run dev` - Development mode with nodemon
- `npm run deploy-commands` - Deploy slash commands
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Code Standards
- ES Modules (import/export)
- Async/await for promises
- Comprehensive error handling
- Detailed logging
- Inline documentation

### Performance Requirements
- Memory usage < 100MB average
- Response time < 3 seconds
- File upload limit: 8MB
- Support 100+ concurrent users

## 🛡️ Security

### Data Protection
- OAuth2 tokens encrypted using AES
- No sensitive data in logs
- Input sanitization and validation
- Rate limiting and abuse prevention

### Privacy
- User data stored temporarily
- No permanent data collection
- Respect API rate limits
- Secure credential handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Discord.js for the excellent Discord API wrapper
- Google APIs for Drive and Search integration
- All contributors and users

## 📞 Support

- **Discord**: [Support Server](https://discord.gg/your-support-server)

---

Made with 💖 by the Hina Bot Development Team
