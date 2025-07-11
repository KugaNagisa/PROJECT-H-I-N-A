# Hina Bot V2 - API Setup Guide

This guide will help you set up all the required APIs and credentials for Hina Bot V2.

## 🤖 Discord Bot Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter name: "Hina Bot V2"
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the token and save it as `DISCORD_TOKEN`
7. Copy the Application ID and save it as `DISCORD_CLIENT_ID`

### 2. Bot Permissions
Enable these permissions:
- Send Messages
- Use Slash Commands
- Embed Links
- Attach Files
- Read Message History
- Add Reactions

### 3. Invite Bot to Server
1. Go to "OAuth2" > "URL Generator"
2. Select "bot" and "applications.commands"
3. Select permissions above
4. Copy generated URL and invite bot to your server

## 🗂️ Google Cloud Platform Setup

### 1. Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Hina Bot V2"
3. Enable billing (required for APIs)

### 2. Enable APIs
Enable these APIs:
- Google Drive API
- Google Custom Search JSON API (optional for web search)

### 3. Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Desktop application"
4. Name: "Hina Bot V2"
5. Copy Client ID as `GOOGLE_CLIENT_ID`
6. Copy Client Secret as `GOOGLE_CLIENT_SECRET`
7. Set `GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob`

### 4. Configure OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Choose "External" (unless using G Suite)
3. Fill required fields:
   - App name: "Hina Bot V2"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `../auth/drive.file`
5. Add test users (for development)

### 5. Google Custom Search (Optional)
1. Go to [Google Custom Search](https://cse.google.com/cse/)
2. Create new search engine
3. Setup:
   - Sites to search: Leave empty for whole web
   - Name: "Hina Bot Search"
4. Get Search Engine ID as `GOOGLE_SEARCH_ENGINE_ID`
5. Go to Google Cloud Console > "Custom Search API"
6. Create API key as `GOOGLE_SEARCH_API_KEY`

##  Security Setup

### 1. Generate Encryption Key
Generate a 32-character random string for `ENCRYPTION_KEY`:

**PowerShell:**
```powershell
-join ((1..32) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})
```

**Node.js:**
```javascript
require('crypto').randomBytes(16).toString('hex')
```

### 2. Environment Variables Summary
Create `.env` file with these variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_test_guild_id

# Google APIs Configuration
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob

# Google Search API (Optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id

# Bot Configuration
LOG_LEVEL=info
NODE_ENV=development
PORT=3000

# Security
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Configuration
```bash
npm run setup
```

### 3. Edit Environment Variables
Edit the `.env` file with your credentials from above.

### 4. Deploy Commands
```bash
npm run deploy-commands
```

### 5. Start Bot
```bash
npm start
```

## 🧪 Testing

### 1. Test Discord Connection
- Bot should appear online in your Discord server
- Try `/ping` command

### 2. Test Google Drive
- Use `/gdrive link` to start OAuth flow
- Follow authorization steps
- Use `/gdrive status` to verify connection

### 3. Test Search (if configured)
- Use `/search nodejs` to test web search
- Should return search results

## 🛠️ Troubleshooting

### Common Issues

**Bot doesn't respond to commands:**
- Check bot is online
- Verify `DISCORD_TOKEN` is correct
- Ensure commands are deployed with `npm run deploy-commands`

**Google Drive authorization fails:**
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Verify OAuth consent screen is configured
- Ensure redirect URI is exactly `urn:ietf:wg:oauth:2.0:oob`

**Search doesn't work:**
- Verify `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`
- Check Custom Search API is enabled
- Ensure billing is enabled on Google Cloud

### Debug Mode
Run with debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Check Logs
Logs are stored in `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

## 📞 Support

If you need help:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Create an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Relevant log entries (remove sensitive data)

## 🔒 Security Notes

- Never commit `.env` file to version control
- Regularly rotate API keys and tokens
- Use test servers for development
- Monitor API usage and quotas
- Keep dependencies updated

## 📝 API Limits

Be aware of these API limits:
- **Discord**: 2000 requests per second per bot
- **Google Drive**: 1000 requests per 100 seconds per user
- **Google Search**: 100 searches per day (free tier)

Configure rate limiting appropriately for your use case.
