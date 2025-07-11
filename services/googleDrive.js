import { google } from 'googleapis';
import { createLogger } from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { validateFileSize, validateFileName } from '../utils/validation.js';
import { formatFileSize, getFileIcon, getFolderIcon } from '../utils/helpers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger();

class GoogleDriveService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        this.userTokens = new Map();
        this.userFolders = new Map();
        
        // Auto-created folder structure
        this.folderStructure = {
            'Hina Bot Uploads': {
                'Images': null,
                'Documents': null,
                'Archives': null,
                'Others': null
            }
        };
    }

    // OAuth2 Authentication
    generateAuthUrl(userId) {
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file'],
            state: userId,
            prompt: 'select_account', // Force account selection
            include_granted_scopes: true
        });
        
        logger.info(`Generated auth URL for user ${userId}`);
        return authUrl;
    }

    // Simplified method to get auth URL
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.file'],
            prompt: 'select_account', // Force account selection
            include_granted_scopes: true
        });
    }

    async storeTokens(userId, code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            
            // Encrypt tokens before storing
            const encryptedTokens = {
                access_token: encrypt(tokens.access_token),
                refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
                expiry_date: tokens.expiry_date
            };
            
            this.userTokens.set(userId, encryptedTokens);
            
            // Setup folder structure for new user
            await this.setupUserFolders(userId);
            
            logger.info(`Stored tokens for user ${userId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to store tokens for user ${userId}:`, error);
            throw error;
        }
    }

    async getUserTokens(userId) {
        const encryptedTokens = this.userTokens.get(userId);
        if (!encryptedTokens) return null;
        
        try {
            const tokens = {
                access_token: decrypt(encryptedTokens.access_token),
                refresh_token: encryptedTokens.refresh_token ? decrypt(encryptedTokens.refresh_token) : null,
                expiry_date: encryptedTokens.expiry_date
            };
            
            // Check if token needs refresh
            if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
                return await this.refreshTokens(userId, tokens);
            }
            
            return tokens;
        } catch (error) {
            logger.error(`Failed to decrypt tokens for user ${userId}:`, error);
            return null;
        }
    }

    async refreshTokens(userId, tokens) {
        try {
            this.oauth2Client.setCredentials(tokens);
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            
            // Store refreshed tokens
            await this.storeTokens(userId, credentials);
            return credentials;
        } catch (error) {
            logger.error(`Failed to refresh tokens for user ${userId}:`, error);
            // Remove invalid tokens
            this.userTokens.delete(userId);
            throw error;
        }
    }

    async setUserAuth(userId) {
        const tokens = await this.getUserTokens(userId);
        if (!tokens) throw new Error('User not authenticated');
        
        this.oauth2Client.setCredentials(tokens);
        return true;
    }

    // Folder Management
    async setupUserFolders(userId) {
        try {
            await this.setUserAuth(userId);
            
            const userFolders = {};
            
            // Create main folder
            const mainFolder = await this.createFolder('Hina Bot Uploads', null);
            userFolders['Hina Bot Uploads'] = mainFolder.id;
            
            // Create subfolders
            const subfolders = ['Images', 'Documents', 'Archives', 'Others'];
            for (const folderName of subfolders) {
                const subfolder = await this.createFolder(folderName, mainFolder.id);
                userFolders[folderName] = subfolder.id;
            }
            
            this.userFolders.set(userId, userFolders);
            logger.info(`Setup folder structure for user ${userId}`);
            
            return userFolders;
        } catch (error) {
            logger.error(`Failed to setup folders for user ${userId}:`, error);
            throw error;
        }
    }

    async createFolder(name, parentId = null) {
        const fileMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined
        };
        
        const folder = await this.drive.files.create({
            resource: fileMetadata,
            fields: 'id,name'
        });
        
        return folder.data;
    }

    async getUserFolders(userId) {
        let folders = this.userFolders.get(userId);
        if (!folders) {
            folders = await this.setupUserFolders(userId);
        }
        return folders;
    }

    // File Operations
    async uploadFile(userId, fileBuffer, fileName, mimeType) {
        try {
            if (!validateFileSize(fileBuffer.length)) {
                throw new Error('File size exceeds 8MB limit');
            }
            
            if (!validateFileName(fileName)) {
                throw new Error('Invalid file name');
            }
            
            await this.setUserAuth(userId);
            const userFolders = await this.getUserFolders(userId);
            
            // Auto-categorize file
            const targetFolder = this.categorizeFile(mimeType, userFolders);
            
            const fileMetadata = {
                name: fileName,
                parents: [targetFolder]
            };
            
            const media = {
                mimeType,
                body: fileBuffer
            };
            
            const file = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,size,mimeType,createdTime,webViewLink'
            });
            
            logger.info(`Uploaded file ${fileName} for user ${userId}`);
            return file.data;
        } catch (error) {
            logger.error(`Failed to upload file for user ${userId}:`, error);
            throw error;
        }
    }

    async downloadFile(userId, fileId) {
        try {
            await this.setUserAuth(userId);
            
            const file = await this.drive.files.get({
                fileId,
                fields: 'name,mimeType,size'
            });
            
            const response = await this.drive.files.get({
                fileId,
                alt: 'media'
            }, { responseType: 'stream' });
            
            return {
                stream: response.data,
                metadata: file.data
            };
        } catch (error) {
            logger.error(`Failed to download file for user ${userId}:`, error);
            throw error;
        }
    }

    async listFiles(userId, folderId = null, pageToken = null) {
        try {
            await this.setUserAuth(userId);
            
            let query = "trashed = false";
            if (folderId) {
                query += ` and '${folderId}' in parents`;
            } else {
                // List root files
                query += " and 'root' in parents";
            }
            
            const response = await this.drive.files.list({
                q: query,
                fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
                orderBy: 'folder,name',
                pageSize: 50,
                pageToken
            });
            
            const files = response.data.files || [];
            
            // Separate folders and files
            const folders = files.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
            const regularFiles = files.filter(file => file.mimeType !== 'application/vnd.google-apps.folder');
            
            return {
                folders: folders.slice(0, 5), // Limit to 5 folders
                files: regularFiles.slice(0, 8), // Limit to 8 files
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            logger.error(`Failed to list files for user ${userId}:`, error);
            throw error;
        }
    }

    async deleteFile(userId, fileId) {
        try {
            await this.setUserAuth(userId);
            
            await this.drive.files.delete({
                fileId
            });
            
            logger.info(`Deleted file ${fileId} for user ${userId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to delete file for user ${userId}:`, error);
            throw error;
        }
    }

    async shareFile(userId, fileId) {
        try {
            await this.setUserAuth(userId);
            
            // Make file publicly viewable
            await this.drive.permissions.create({
                fileId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            
            // Get file details
            const file = await this.drive.files.get({
                fileId,
                fields: 'name,webViewLink,webContentLink'
            });
            
            logger.info(`Shared file ${fileId} for user ${userId}`);
            return file.data;
        } catch (error) {
            logger.error(`Failed to share file for user ${userId}:`, error);
            throw error;
        }
    }

    async getFileInfo(userId, fileId) {
        try {
            await this.setUserAuth(userId);
            
            const file = await this.drive.files.get({
                fileId,
                fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents'
            });
            
            return file.data;
        } catch (error) {
            logger.error(`Failed to get file info for user ${userId}:`, error);
            throw error;
        }
    }

    // Helper Methods
    categorizeFile(mimeType, userFolders) {
        if (mimeType.startsWith('image/')) {
            return userFolders['Images'];
        } else if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text/')) {
            return userFolders['Documents'];
        } else if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
            return userFolders['Archives'];
        } else {
            return userFolders['Others'];
        }
    }

    isUserAuthenticated(userId) {
        return this.userTokens.has(userId);
    }

    // Alias for backward compatibility
    isUserConnected(userId) {
        return this.isUserAuthenticated(userId);
    }

    unlinkUser(userId) {
        this.userTokens.delete(userId);
        this.userFolders.delete(userId);
        logger.info(`Unlinked user ${userId}`);
    }

    async searchFiles(userId, query) {
        try {
            await this.setUserAuth(userId);
            
            const response = await this.drive.files.list({
                q: `name contains '${query}' and trashed=false`,
                fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
                pageSize: 100
            });
            
            return response.data.files || [];
        } catch (error) {
            logger.error(`Failed to search files for user ${userId}:`, error);
            throw error;
        }
    }

    async getUserInfo(userId) {
        try {
            await this.setUserAuth(userId);
            
            const about = await this.drive.about.get({
                fields: 'user'
            });
            
            return about.data.user;
        } catch (error) {
            logger.error(`Failed to get user info for ${userId}:`, error);
            throw error;
        }
    }

    async getStorageQuota(userId) {
        try {
            await this.setUserAuth(userId);
            
            const about = await this.drive.about.get({
                fields: 'storageQuota'
            });
            
            const quota = about.data.storageQuota;
            return {
                limit: parseInt(quota.limit) || 0,
                usage: parseInt(quota.usage) || 0,
                usageInDrive: parseInt(quota.usageInDrive) || 0,
                usageInDriveTrash: parseInt(quota.usageInDriveTrash) || 0
            };
        } catch (error) {
            logger.error(`Failed to get storage quota for ${userId}:`, error);
            throw error;
        }
    }

    async getUserStatus(userId) {
        if (!this.isUserAuthenticated(userId)) {
            return { authenticated: false };
        }
        
        try {
            await this.setUserAuth(userId);
            
            const about = await this.drive.about.get({
                fields: 'user,storageQuota'
            });
            
            return {
                authenticated: true,
                user: about.data.user,
                storage: about.data.storageQuota
            };
        } catch (error) {
            logger.error(`Failed to get user status for ${userId}:`, error);
            return { authenticated: false };
        }
    }
}

export default new GoogleDriveService();
