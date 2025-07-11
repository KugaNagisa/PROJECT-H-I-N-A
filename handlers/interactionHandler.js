import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    EmbedBuilder 
} from 'discord.js';
import googleDriveService from '../services/googleDrive.js';
import searchService from '../services/search.js';
import { createLogger } from '../utils/logger.js';
import { 
    createSuccessEmbed, 
    createErrorEmbed, 
    createInfoEmbed, 
    createLoadingEmbed 
} from '../utils/embeds.js';
import { 
    formatFileSize, 
    formatDate, 
    getFileIcon, 
    getFolderIcon, 
    createBreadcrumb, 
    truncateString,
    getRandomCuteResponse,
    getRandomErrorResponse
} from '../utils/helpers.js';
import QRCode from 'qrcode';

const logger = createLogger();

export async function handleButtonInteraction(interaction, action, params) {
    const userId = interaction.user.id;

    // Prevent double replies
    if (interaction.replied || interaction.deferred) {
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        switch (action) {
            case 'gdrive':
                await handleGoogleDriveButton(interaction, params, userId);
                break;
            case 'search':
                await handleSearchButton(interaction, params, userId);
                break;
            case 'refresh':
                await handleRefreshButton(interaction, params, userId);
                break;
            case 'back':
                await handleBackButton(interaction, params, userId);
                break;
            case 'folder':
                await handleFolderButton(interaction, params, userId);
                break;
            case 'download':
                await handleDownloadButton(interaction, params, userId);
                break;
            case 'delete':
                await handleDeleteButton(interaction, params, userId);
                break;
            case 'share':
                await handleShareButton(interaction, params, userId);
                break;
            case 'confirm':
                await handleConfirmButton(interaction, params, userId);
                break;
            case 'cancel':
                await handleCancelButton(interaction, params, userId);
                break;
            // Additional Google Drive actions
            case 'quick':
                await handleQuickShareButton(interaction, params, userId);
                break;
            case 'upload':
                await handleUploadRetryButton(interaction, params, userId);
                break;
            // Additional specific Google Drive actions
            case 'gdrive_refresh':
                await handleGdriveRefreshButton(interaction, params, userId);
                break;
            case 'gdrive_upload':
                await handleGdriveUploadButton(interaction, params, userId);
                break;
            case 'gdrive_quickshare':
                await handleGdriveQuickShareButton(interaction, params, userId);
                break;
            case 'gdrive_quickdownload':
                await handleGdriveQuickDownloadButton(interaction, params, userId);
                break;
            case 'share_info':
                await handleShareInfoButton(interaction, params, userId);
                break;
            case 'share_retry':
                await handleShareRetryButton(interaction, params, userId);
                break;
            case 'delete_retry':
                await handleDeleteRetryButton(interaction, params, userId);
                break;
            default:
                await interaction.editReply({
                    embeds: [createErrorEmbed('Unknown Action', 'Không hiểu action này! 🤔')]
                });
        }
    } catch (error) {
        logger.error(`Error in button interaction handler:`, error);
        
        const errorEmbed = createErrorEmbed(
            'Interaction Error',
            `${getRandomErrorResponse()}\nLỗi: ${error.message || 'Unknown error'}`
        );
        
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

export async function handleSelectMenuInteraction(interaction, action, params) {
    const userId = interaction.user.id;
    const selectedValue = interaction.values[0];

    await interaction.deferReply({ ephemeral: true });

    try {
        switch (action) {
            case 'searchtype':
                await handleSearchTypeSelect(interaction, selectedValue, userId);
                break;
            case 'help':
                await handleHelpSelect(interaction, selectedValue, userId);
                break;
            default:
                await interaction.editReply({
                    embeds: [createErrorEmbed('Unknown Selection', 'Không hiểu lựa chọn này! 🤔')]
                });
        }
    } catch (error) {
        logger.error(`Error in select menu interaction handler:`, error);
        
        const errorEmbed = createErrorEmbed(
            'Selection Error',
            `${getRandomErrorResponse()}\nLỗi: ${error.message || 'Unknown error'}`
        );
        
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleGoogleDriveButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;

    switch (subAction) {
        case 'authorize':
            const authUrl = googleDriveService.generateAuthUrl(userId);
            
            const authEmbed = createInfoEmbed(
                'Google Drive Authorization',
                `Hãy click vào link bên dưới để kết nối Google Drive nhé! 😊\n\n**Bước 1:** Click vào nút "Authorize"\n**Bước 2:** Đăng nhập Google và cho phép quyền truy cập\n**Bước 3:** Copy code và dùng lệnh \`/gdrive verify <code>\``
            );

            const authRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🔑 Authorize Google Drive')
                        .setStyle(ButtonStyle.Link)
                        .setURL(authUrl)
                );

            await interaction.editReply({
                embeds: [authEmbed],
                components: [authRow]
            });
            break;

        case 'list':
            const folderId = subParams[0] || null;
            await displayFileManager(interaction, userId, folderId);
            break;

        case 'upload':
            const uploadEmbed = createInfoEmbed(
                'Upload File',
                `Để upload file, hãy dùng lệnh \`/gdrive upload\` và attach file bạn muốn upload! 📁\n\nGiới hạn: 8MB per file 💖`
            );

            await interaction.editReply({ embeds: [uploadEmbed] });
            break;

        case 'help':
            await handleGdriveHelpButton(interaction, subParams, userId);
            break;

        case 'status':
            await handleGdriveStatusButton(interaction, subParams, userId);
            break;

        case 'link':
            await handleGdriveLinkButton(interaction, subParams, userId);
            break;

        case 'search':
            await handleGdriveSearchButton(interaction, subParams, userId);
            break;

        default:
            await interaction.editReply({
                embeds: [createErrorEmbed('Unknown Action', 'Không hiểu Google Drive action này! 🤔')]
            });
    }
}

async function handleSearchButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;

    switch (subAction) {
        case 'type':
            const searchTypeMenu = new StringSelectMenuBuilder()
                .setCustomId('searchtype_select')
                .setPlaceholder('Chọn loại tìm kiếm...')
                .addOptions([
                    {
                        label: '🌐 Web Search',
                        description: 'Tìm kiếm web thông thường',
                        value: 'web'
                    },
                    {
                        label: '🖼️ Image Search',
                        description: 'Tìm kiếm hình ảnh',
                        value: 'image'
                    },
                    {
                        label: '📰 News Search',
                        description: 'Tìm kiếm tin tức',
                        value: 'news'
                    },
                    {
                        label: '🎥 Video Search',
                        description: 'Tìm kiếm video',
                        value: 'video'
                    },
                    {
                        label: '📄 Document Search',
                        description: 'Tìm kiếm tài liệu',
                        value: 'document'
                    }
                ]);

            const searchRow = new ActionRowBuilder()
                .addComponents(searchTypeMenu);

            await interaction.editReply({
                embeds: [createInfoEmbed('Search Type', 'Chọn loại tìm kiếm bạn muốn! 🔍')],
                components: [searchRow]
            });
            break;

        default:
            await interaction.editReply({
                embeds: [createErrorEmbed('Unknown Action', 'Không hiểu search action này! 🤔')]
            });
    }
}

async function handleFolderButton(interaction, params, userId) {
    const folderId = params[0];
    await displayFileManager(interaction, userId, folderId);
}

async function handleDownloadButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;
    
    switch (subAction) {
        case 'direct':
            const fileId = subParams[0];
            await downloadDirectFile(interaction, userId, fileId);
            break;
            
        case 'retry':
            const fileName = subParams[0];
            await retryDownload(interaction, userId, fileName);
            break;
            
        default:
            // Legacy support - assume first param is fileId
            const legacyFileId = params[0];
            await downloadDirectFile(interaction, userId, legacyFileId);
            break;
    }
}

async function downloadDirectFile(interaction, userId, fileId) {
    try {
        const loadingEmbed = createLoadingEmbed(
            'Downloading File',
            'Đang tải file xuống... Vui lòng chờ! 🔄'
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        const { stream, metadata } = await googleDriveService.downloadFile(userId, fileId);
        
        // For now, we'll just show file info since Discord has file size limits
        const fileEmbed = createSuccessEmbed(
            'File Ready for Download',
            `**File:** ${metadata.name}\n**Size:** ${formatFileSize(metadata.size)}\n**Type:** ${metadata.mimeType}\n\n${getRandomCuteResponse()}`
        );

        const downloadRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`share_quick_${userId}_${fileId}`)
                    .setLabel('🔗 Get Share Link')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`download_retry_${userId}_${metadata.name}`)
                    .setLabel('🔄 Retry Download')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [fileEmbed],
            components: [downloadRow]
        });
        
    } catch (error) {
        logger.error(`Download error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Download Failed', `Không thể tải file: ${error.message} 😅`)]
        });
    }
}

async function retryDownload(interaction, userId, fileName) {
    try {
        const loadingEmbed = createLoadingEmbed(
            'Retrying Download',
            `Đang thử lại tải file "${fileName}"... 🔄`
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name first
        const searchResults = await googleDriveService.searchFiles(userId, fileName);
        
        if (searchResults.length === 0) {
            throw new Error(`Không tìm thấy file "${fileName}"`);
        }

        const file = searchResults[0];
        await downloadDirectFile(interaction, userId, file.id);
        
    } catch (error) {
        logger.error(`Retry download error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Retry Failed', `Không thể thử lại tải file: ${error.message} 😅`)]
        });
    }
}

async function handleDeleteButton(interaction, params, userId) {
    const fileId = params[0];
    const fileName = params[1] || 'Unknown';
    
    // Show confirmation dialog
    const confirmEmbed = createInfoEmbed(
        'Confirm Delete',
        `Bạn có chắc chắn muốn xóa file **${fileName}**?\n\n⚠️ Hành động này không thể hoàn tác!`
    );

    const confirmRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_delete_${fileId}`)
                .setLabel('✅ Xóa')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('❌ Hủy')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmRow]
    });
}

async function handleShareButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;
    
    switch (subAction) {
        case 'quick':
            const fileId = subParams[0];
            await shareQuickFile(interaction, userId, fileId);
            break;
            
        default:
            // Legacy support - assume first param is fileId
            const legacyFileId = params[0];
            await shareQuickFile(interaction, userId, legacyFileId);
            break;
    }
}

async function shareQuickFile(interaction, userId, fileId) {
    try {
        const loadingEmbed = createLoadingEmbed(
            'Sharing File',
            'Đang tạo link chia sẻ... Chờ chút nhé! 🔗'
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        const sharedFile = await googleDriveService.shareFile(userId, fileId);
        
        // Generate QR code for the share link
        const qrCodeBuffer = await QRCode.toBuffer(sharedFile.webViewLink);
        
        const shareEmbed = createSuccessEmbed(
            'File Shared Successfully',
            `**File:** ${sharedFile.name}\n\n**View Link:** [Click here](${sharedFile.webViewLink})\n**Download Link:** [Click here](${sharedFile.webContentLink})\n\n${getRandomCuteResponse()}`
        );

        const shareRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 View File')
                    .setStyle(ButtonStyle.Link)
                    .setURL(sharedFile.webViewLink),
                new ButtonBuilder()
                    .setLabel('⬇️ Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(sharedFile.webContentLink)
            );

        await interaction.editReply({
            embeds: [shareEmbed],
            components: [shareRow],
            files: [{
                attachment: qrCodeBuffer,
                name: 'qr-code.png',
                description: 'QR Code for file link'
            }]
        });
        
    } catch (error) {
        logger.error(`Share error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Share Failed', `Không thể chia sẻ file: ${error.message} 😅`)]
        });
    }
}

async function handleConfirmButton(interaction, params, userId) {
    const [action, ...actionParams] = params;

    switch (action) {
        case 'delete':
            const fileId = actionParams[0];
            
            try {
                const loadingEmbed = createLoadingEmbed(
                    'Deleting File',
                    'Đang xóa file... Chờ chút! 🗑️'
                );
                
                await interaction.editReply({ embeds: [loadingEmbed] });

                await googleDriveService.deleteFile(userId, fileId);
                
                const successEmbed = createSuccessEmbed(
                    'File Deleted',
                    `File đã được xóa thành công! ${getRandomCuteResponse()}`
                );

                await interaction.editReply({ embeds: [successEmbed], components: [] });
                
            } catch (error) {
                logger.error(`Delete error:`, error);
                await interaction.editReply({
                    embeds: [createErrorEmbed('Delete Failed', `Không thể xóa file: ${error.message} 😅`)],
                    components: []
                });
            }
            break;

        default:
            await interaction.editReply({
                embeds: [createErrorEmbed('Unknown Confirmation', 'Không hiểu confirmation này! 🤔')],
                components: []
            });
    }
}

async function handleCancelButton(interaction, params, userId) {
    const cancelEmbed = createInfoEmbed(
        'Action Cancelled',
        `Đã hủy thao tác! ${getRandomCuteResponse()}`
    );

    await interaction.editReply({ embeds: [cancelEmbed], components: [] });
}

async function handleRefreshButton(interaction, params, userId) {
    const folderId = params[0] || null;
    await displayFileManager(interaction, userId, folderId);
}

async function handleBackButton(interaction, params, userId) {
    const parentFolderId = params[0] || null;
    await displayFileManager(interaction, userId, parentFolderId);
}

async function displayFileManager(interaction, userId, folderId = null) {
    try {
        const loadingEmbed = createLoadingEmbed(
            'Loading Files',
            'Đang tải danh sách file... Chờ chút! 📂'
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        const { folders, files } = await googleDriveService.listFiles(userId, folderId);
        
        // Create breadcrumb
        const breadcrumb = createBreadcrumb(folderId || '/');
        
        // Create embed
        const fileEmbed = new EmbedBuilder()
            .setTitle('📁 File Manager')
            .setDescription(`**Location:** ${breadcrumb}`)
            .setColor(0x4285f4)
            .setFooter({ text: '💖 Hina Bot • Google Drive' })
            .setTimestamp();

        // Add folders
        if (folders.length > 0) {
            const folderList = folders.map(folder => 
                `${getFolderIcon()} **${truncateString(folder.name, 30)}**`
            ).join('\n');
            
            fileEmbed.addFields({
                name: '📁 Folders',
                value: folderList,
                inline: false
            });
        }

        // Add files
        if (files.length > 0) {
            const fileList = files.map(file => 
                `${getFileIcon(file.mimeType)} **${truncateString(file.name, 30)}**\n` +
                `Size: ${formatFileSize(file.size || 0)} • ${formatDate(file.modifiedTime)}`
            ).join('\n\n');
            
            fileEmbed.addFields({
                name: '📄 Files',
                value: fileList,
                inline: false
            });
        }

        if (folders.length === 0 && files.length === 0) {
            fileEmbed.setDescription(
                `**Location:** ${breadcrumb}\n\n*Folder này trống! 📭*`
            );
        }

        // Create action buttons
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`refresh_${folderId || 'root'}`)
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('gdrive_upload')
                    .setLabel('📤 Upload')
                    .setStyle(ButtonStyle.Primary)
            );

        if (folderId) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`back_parent`)
                    .setLabel('⬅️ Back')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        const components = [actionRow];

        // Create folder navigation buttons
        if (folders.length > 0) {
            const folderButtons = folders.slice(0, 5).map(folder => 
                new ButtonBuilder()
                    .setCustomId(`folder_${folder.id}`)
                    .setLabel(truncateString(folder.name, 20))
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📁')
            );

            const folderRow = new ActionRowBuilder()
                .addComponents(folderButtons);
            
            components.push(folderRow);
        }

        // Create file action buttons
        if (files.length > 0) {
            const fileButtons = files.slice(0, 3).map(file => 
                new ButtonBuilder()
                    .setCustomId(`share_${file.id}`)
                    .setLabel(truncateString(file.name, 15))
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔗')
            );

            const fileRow = new ActionRowBuilder()
                .addComponents(fileButtons);
            
            components.push(fileRow);
        }

        await interaction.editReply({
            embeds: [fileEmbed],
            components: components
        });
        
    } catch (error) {
        logger.error(`File manager error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('File Manager Error', `Không thể tải file manager: ${error.message} 😅`)]
        });
    }
}

// New Google Drive action handlers
async function handleQuickShareButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;
    
    switch (subAction) {
        case 'share':
            const fileId = subParams[0];
            await shareQuickFile(interaction, userId, fileId);
            break;
            
        default:
            await interaction.editReply({
                embeds: [createErrorEmbed('Unknown Quick Action', 'Không hiểu quick action này! 🤔')]
            });
    }
}

async function handleUploadRetryButton(interaction, params, userId) {
    const [subAction, ...subParams] = params;
    
    switch (subAction) {
        case 'retry':
            const retryEmbed = createInfoEmbed(
                'Upload Retry',
                `Để thử lại upload file, hãy dùng lệnh \`/gdrive upload\` và attach file bạn muốn upload lại! 📁\n\n💡 **Tip:** Kiểm tra kích thước file không vượt quá 8MB`
            );

            const retryRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gdrive_status_${userId}`)
                        .setLabel('📊 Check Status')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`gdrive_list_${userId}`)
                        .setLabel('📁 View Files')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ 
                embeds: [retryEmbed],
                components: [retryRow]
            });
            break;
            
        default:
            await interaction.editReply({
                embeds: [createErrorEmbed('Unknown Upload Action', 'Không hiểu upload action này! 🤔')]
            });
    }
}

async function handleGdriveHelpButton(interaction, params, userId) {
    const helpEmbed = createInfoEmbed(
        '📚 Google Drive Help',
        `**Hướng dẫn sử dụng Google Drive:**\n\n` +
        `🔗 **Connect:** \`/gdrive connect\` - Kết nối tài khoản Google\n` +
        `📂 **List:** \`/gdrive list\` - Xem danh sách file\n` +
        `📤 **Upload:** \`/gdrive upload\` - Upload file lên Drive\n` +
        `🔍 **Search:** \`/gdrive search <query>\` - Tìm kiếm file\n` +
        `📄 **Info:** \`/gdrive info <filename>\` - Xem thông tin file\n` +
        `📊 **Status:** \`/gdrive status\` - Kiểm tra trạng thái kết nối\n\n` +
        `💡 **Tips:**\n` +
        `• File tối đa 8MB\n` +
        `• Hỗ trợ mọi loại file\n` +
        `• Auto-categorize theo loại file\n\n` +
        `${getRandomCuteResponse()}`
    );

    const helpRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`gdrive_status_${userId}`)
                .setLabel('📊 Check Status')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`gdrive_list_${userId}`)
                .setLabel('📁 My Files')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.editReply({ 
        embeds: [helpEmbed],
        components: [helpRow]
    });
}

async function handleGdriveStatusButton(interaction, params, userId) {
    try {
        const loadingEmbed = createLoadingEmbed(
            'Checking Status',
            'Đang kiểm tra trạng thái kết nối... 🔄'
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        const isConnected = await googleDriveService.isUserConnected(userId);
        
        if (isConnected) {
            // Get user info and storage quota
            try {
                const userInfo = await googleDriveService.getUserInfo(userId);
                const storageQuota = await googleDriveService.getStorageQuota(userId);
                
                const statusEmbed = createSuccessEmbed(
                    '✅ Google Drive Connected',
                    `**Account:** ${userInfo.displayName}\n` +
                    `**Email:** ${userInfo.emailAddress}\n` +
                    `**Storage Used:** ${formatFileSize(storageQuota.usage)} / ${formatFileSize(storageQuota.limit)}\n` +
                    `**Available:** ${formatFileSize(storageQuota.limit - storageQuota.usage)}\n\n` +
                    `${getRandomCuteResponse()}`
                );

                const statusRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`gdrive_list_${userId}`)
                            .setLabel('📁 View Files')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`gdrive_search_${userId}`)
                            .setLabel('🔍 Search Files')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({ 
                    embeds: [statusEmbed],
                    components: [statusRow]
                });
                
            } catch (error) {
                logger.error(`Error getting detailed status:`, error);
                
                const basicStatusEmbed = createSuccessEmbed(
                    '✅ Google Drive Connected',
                    `Tài khoản Google Drive đã được kết nối thành công!\n\n${getRandomCuteResponse()}`
                );

                const basicStatusRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`gdrive_list_${userId}`)
                            .setLabel('📁 View Files')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({ 
                    embeds: [basicStatusEmbed],
                    components: [basicStatusRow]
                });
            }
        } else {
            const notConnectedEmbed = createErrorEmbed(
                '❌ Not Connected',
                `Bạn chưa kết nối Google Drive!\n\nHãy dùng lệnh \`/gdrive connect\` để kết nối tài khoản nhé! 💖`
            );

            const connectRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gdrive_link_${userId}`)
                        .setLabel('🔗 Connect Now')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ 
                embeds: [notConnectedEmbed],
                components: [connectRow]
            });
        }
        
    } catch (error) {
        logger.error(`Status check error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Status Check Failed', `Không thể kiểm tra trạng thái: ${error.message} 😅`)]
        });
    }
}

async function handleGdriveLinkButton(interaction, params, userId) {
    const authUrl = googleDriveService.generateAuthUrl(userId);
    
    const linkEmbed = createInfoEmbed(
        '🔗 Connect Google Drive',
        `Để kết nối Google Drive với Hina Bot:\n\n` +
        `**Bước 1:** Click nút "Connect Google Drive" bên dưới\n` +
        `**Bước 2:** Đăng nhập và cho phép quyền truy cập\n` +
        `**Bước 3:** Copy authorization code\n` +
        `**Bước 4:** Dùng lệnh \`/gdrive verify <code>\`\n\n` +
        `💡 **Lưu ý:** Code chỉ có hiệu lực trong 10 phút!`
    );

    const linkRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('🔑 Connect Google Drive')
                .setStyle(ButtonStyle.Link)
                .setURL(authUrl),
            new ButtonBuilder()
                .setCustomId(`gdrive_help_${userId}`)
                .setLabel('❓ Help')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({
        embeds: [linkEmbed],
        components: [linkRow]
    });
}

async function handleGdriveSearchButton(interaction, params, userId) {
    const searchEmbed = createInfoEmbed(
        '🔍 Search Google Drive',
        `Để tìm kiếm file trong Google Drive:\n\n` +
        `**Cách 1:** Dùng lệnh \`/gdrive search <từ khóa>\`\n` +
        `**Cách 2:** Dùng file manager và navigate qua folders\n\n` +
        `**Ví dụ tìm kiếm:**\n` +
        `• \`/gdrive search report.pdf\` - Tìm file cụ thể\n` +
        `• \`/gdrive search *.jpg\` - Tìm tất cả ảnh JPG\n` +
        `• \`/gdrive search mimeType:application/pdf\` - Tìm PDF\n\n` +
        `${getRandomCuteResponse()}`
    );

    const searchRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`gdrive_list_${userId}`)
                .setLabel('📁 Browse Files')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`gdrive_status_${userId}`)
                .setLabel('📊 Check Status')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ 
        embeds: [searchEmbed],
        components: [searchRow]
    });
}

// Additional Google Drive handlers
async function handleGdriveRefreshButton(interaction, params, userId) {
    const folderId = params[0] || null;
    await displayFileManager(interaction, userId, folderId);
}

async function handleGdriveUploadButton(interaction, params, userId) {
    const uploadEmbed = createInfoEmbed(
        '📤 Upload File to Google Drive',
        `Để upload file lên Google Drive:\n\n` +
        `**Cách sử dụng:** \`/gdrive upload\` + attach file\n\n` +
        `**Giới hạn:**\n` +
        `• Tối đa 8MB per file\n` +
        `• Hỗ trợ mọi loại file\n` +
        `• Auto-categorize theo loại\n\n` +
        `**Categories:**\n` +
        `📸 Images: JPG, PNG, GIF, etc.\n` +
        `📄 Documents: PDF, DOC, TXT, etc.\n` +
        `📦 Archives: ZIP, RAR, 7Z, etc.\n` +
        `📁 Others: Các file khác\n\n` +
        `${getRandomCuteResponse()}`
    );

    const uploadRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`gdrive_list_${userId}`)
                .setLabel('📁 View Files')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`gdrive_status_${userId}`)
                .setLabel('📊 Check Status')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ 
        embeds: [uploadEmbed],
        components: [uploadRow]
    });
}

async function handleGdriveQuickShareButton(interaction, params, userId) {
    const quickShareEmbed = createInfoEmbed(
        '🚀 Quick Share',
        `Quick Share cho phép bạn nhanh chóng chia sẻ file với bạn bè!\n\n` +
        `**Cách sử dụng:**\n` +
        `1. Chọn file từ danh sách\n` +
        `2. Click nút "Quick Share"\n` +
        `3. Copy link và chia sẻ\n\n` +
        `**Tính năng:**\n` +
        `🔗 Link chia sẻ trực tiếp\n` +
        `📱 QR Code tự động\n` +
        `👀 View và Download links\n\n` +
        `${getRandomCuteResponse()}`
    );

    const quickShareRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`gdrive_list_${userId}`)
                .setLabel('📁 Choose File')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`gdrive_search_${userId}`)
                .setLabel('🔍 Search File')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ 
        embeds: [quickShareEmbed],
        components: [quickShareRow]
    });
}

async function handleGdriveQuickDownloadButton(interaction, params, userId) {
    const quickDownloadEmbed = createInfoEmbed(
        '⚡ Quick Download',
        `Quick Download giúp bạn tải file nhanh chóng!\n\n` +
        `**Lưu ý Discord:**\n` +
        `• Discord giới hạn file 8MB\n` +
        `• File lớn hơn sẽ được chia sẻ qua link\n` +
        `• Hỗ trợ preview cho ảnh nhỏ\n\n` +
        `**Cách sử dụng:**\n` +
        `1. Chọn file từ danh sách\n` +
        `2. Click "Quick Download"\n` +
        `3. File sẽ được tải hoặc chia sẻ link\n\n` +
        `${getRandomCuteResponse()}`
    );

    const quickDownloadRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`gdrive_list_${userId}`)
                .setLabel('📁 Choose File')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`gdrive_search_${userId}`)
                .setLabel('🔍 Find File')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ 
        embeds: [quickDownloadEmbed],
        components: [quickDownloadRow]
    });
}

async function handleShareInfoButton(interaction, params, userId) {
    const fileId = params[0];
    
    try {
        const loadingEmbed = createLoadingEmbed(
            'Getting File Info',
            'Đang lấy thông tin file... 📋'
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        // Get file metadata
        await googleDriveService.setUserAuth(userId);
        const response = await googleDriveService.drive.files.get({
            fileId: fileId,
            fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,permissions'
        });

        const file = response.data;
        
        const infoEmbed = createInfoEmbed(
            '📋 File Information',
            `**Name:** ${file.name}\n` +
            `**Type:** ${file.mimeType}\n` +
            `**Size:** ${formatFileSize(file.size || 0)}\n` +
            `**Created:** ${formatDate(file.createdTime)}\n` +
            `**Modified:** ${formatDate(file.modifiedTime)}\n` +
            `**File ID:** \`${file.id}\`\n\n` +
            `${getRandomCuteResponse()}`
        );

        const infoRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`share_quick_${userId}_${fileId}`)
                    .setLabel('🔗 Share Now')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`download_direct_${userId}_${fileId}`)
                    .setLabel('⬇️ Download')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [infoEmbed],
            components: [infoRow]
        });
        
    } catch (error) {
        logger.error(`Share info error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Info Failed', `Không thể lấy thông tin file: ${error.message} 😅`)]
        });
    }
}

async function handleShareRetryButton(interaction, params, userId) {
    const fileName = params[0];
    
    try {
        const loadingEmbed = createLoadingEmbed(
            'Retrying Share',
            `Đang thử lại chia sẻ file "${fileName}"... 🔄`
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name first
        const searchResults = await googleDriveService.searchFiles(userId, fileName);
        
        if (searchResults.length === 0) {
            throw new Error(`Không tìm thấy file "${fileName}"`);
        }

        const file = searchResults[0];
        await shareQuickFile(interaction, userId, file.id);
        
    } catch (error) {
        logger.error(`Retry share error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Retry Failed', `Không thể thử lại chia sẻ: ${error.message} 😅`)]
        });
    }
}

async function handleDeleteRetryButton(interaction, params, userId) {
    const fileName = params[0];
    
    try {
        const loadingEmbed = createLoadingEmbed(
            'Retrying Delete',
            `Đang thử lại xóa file "${fileName}"... 🗑️`
        );
        
        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name first
        const searchResults = await googleDriveService.searchFiles(userId, fileName);
        
        if (searchResults.length === 0) {
            throw new Error(`Không tìm thấy file "${fileName}"`);
        }

        const file = searchResults[0];
        
        // Show confirmation dialog
        const confirmEmbed = createInfoEmbed(
            'Confirm Delete',
            `Tìm thấy file: **${file.name}**\n\nBạn có chắc chắn muốn xóa file này?\n\n⚠️ Hành động này không thể hoàn tác!`
        );

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_delete_${file.id}`)
                    .setLabel('✅ Xóa')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('❌ Hủy')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [confirmEmbed],
            components: [confirmRow]
        });
        
    } catch (error) {
        logger.error(`Retry delete error:`, error);
        await interaction.editReply({
            embeds: [createErrorEmbed('Retry Failed', `Không thể thử lại xóa file: ${error.message} 😅`)]
        });
    }
}

async function handleSearchTypeSelect(interaction, searchType, userId) {
    const searchEmbed = createInfoEmbed(
        `${searchService.getSearchTypeEmoji(searchType)} Search Selected`,
        `Bạn đã chọn **${searchType.charAt(0).toUpperCase() + searchType.slice(1)} Search**!\n\nHãy dùng lệnh \`/search\` để tìm kiếm nhé! 🔍`
    );

    await interaction.editReply({ embeds: [searchEmbed], components: [] });
}

async function handleHelpSelect(interaction, helpCategory, userId) {
    const helpEmbed = createInfoEmbed(
        `Help: ${helpCategory}`,
        `Đây là hướng dẫn cho category **${helpCategory}**!\n\nComing soon... 💖`
    );

    await interaction.editReply({ embeds: [helpEmbed], components: [] });
}
