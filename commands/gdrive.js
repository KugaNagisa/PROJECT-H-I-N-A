import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import googleDriveService from '../services/googleDrive.js';
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
import { validateFileSize, validateFileName } from '../utils/validation.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Constants
const TIMEOUT_DURATION = 300000; // 5 minutes
const MAX_FOLDER_DISPLAY = 5;
const MAX_FILE_DISPLAY = 8;
const TEMP_FILE_CLEANUP_DELAY = 5000;

const EMBED_COLORS = {
    SUCCESS: '#00ff00',
    ERROR: '#ff0000',
    WARNING: '#ffa500',
    INFO: '#4285f4',
    PROCESSING: '#ffff00',
    SHARE: '#00D4AA',
    PREMIUM: '#9945FF'
};

const FILE_CATEGORIES = {
    IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    ARCHIVES: ['zip', 'rar', '7z', 'tar', 'gz']
};

/**
 * Create not connected embed with cute Vietnamese style
 */
function createNotConnectedEmbed() {
    return new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('🔗 Onii-chan chưa kết nối Google Drive nè~')
        .setDescription('Em cần onii-chan kết nối Google Drive trước khi sử dụng tính năng này! 🥺')
        .addFields([
            { 
                name: '🚀 Cách kết nối nè~', 
                value: 'Sử dụng lệnh `/gdrive link` để kết nối tài khoản Google Drive của onii-chan nhé! ✨',
                inline: false 
            }
        ])
        .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
        .setTimestamp();
}

/**
 * Enhanced file icon function with more types
 */
function getEnhancedFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    const icons = {
        // Images
        jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🎞️', bmp: '🖼️', svg: '🎨', webp: '🖼️',
        // Documents  
        pdf: '📄', doc: '📝', docx: '📝', txt: '📃', rtf: '📄', odt: '📄',
        // Archives
        zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
        // Audio
        mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵',
        // Video
        mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
        // Code
        js: '💻', py: '🐍', html: '🌐', css: '🎨', json: '⚙️'
    };
    
    return icons[extension] || '📄';
}

export default {
    data: new SlashCommandBuilder()
        .setName('gdrive')
        .setDescription('Google Drive management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('link')
                .setDescription('Kết nối với Google Drive của bạn')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlink')
                .setDescription('Ngắt kết nối với Google Drive')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Kiểm tra trạng thái kết nối Google Drive')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('verify')
                .setDescription('Xác thực mã code từ Google')
                .addStringOption(option =>
                    option
                        .setName('code')
                        .setDescription('Mã code từ Google OAuth')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('Upload file lên Google Drive')
                .addAttachmentOption(option =>
                    option
                        .setName('file')
                        .setDescription('File cần upload (tối đa 8MB)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('download')
                .setDescription('Download file từ Google Drive')
                .addStringOption(option =>
                    option
                        .setName('filename')
                        .setDescription('Tên file cần download')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Hiển thị danh sách file trong Google Drive')
                .addStringOption(option =>
                    option
                        .setName('folder')
                        .setDescription('Tên folder (để trống để xem root)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('share')
                .setDescription('Chia sẻ file công khai')
                .addStringOption(option =>
                    option
                        .setName('filename')
                        .setDescription('Tên file cần chia sẻ')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Xóa file khỏi Google Drive')
                .addStringOption(option =>
                    option
                        .setName('filename')
                        .setDescription('Tên file cần xóa')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            switch (subcommand) {
                case 'link':
                    await handleLink(interaction, userId);
                    break;
                case 'unlink':
                    await handleUnlink(interaction, userId);
                    break;
                case 'status':
                    await handleStatus(interaction, userId);
                    break;
                case 'verify':
                    await handleVerify(interaction, userId);
                    break;
                case 'upload':
                    await handleUpload(interaction, userId);
                    break;
                case 'download':
                    await handleDownload(interaction, userId);
                    break;
                case 'list':
                    await handleList(interaction, userId);
                    break;
                case 'share':
                    await handleShare(interaction, userId);
                    break;
                case 'delete':
                    await handleDelete(interaction, userId);
                    break;
                default:
                    await interaction.reply({
                        embeds: [createErrorEmbed('Unknown Command', 'Không hiểu lệnh này! 🤔')],
                        flags: MessageFlags.Ephemeral
                    });
            }
        } catch (error) {
            const errorEmbed = createErrorEmbed(
                'Command Error',
                `${getRandomErrorResponse()}\nLỗi: ${error.message}`
            );
            
            logger.error('Error executing command gdrive:', error);
            
            // Check if interaction has been replied to
            if (interaction.replied || interaction.deferred) {
                try {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } catch (followUpError) {
                    logger.error('Failed to send follow-up error message:', followUpError);
                }
            } else {
                try {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } catch (replyError) {
                    logger.error('Failed to send error reply:', replyError);
                }
            }
        }
    }
};

async function handleLink(interaction, userId) {
    if (googleDriveService.isUserAuthenticated(userId)) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle('✅ Yay~! Google Drive đã kết nối rồi!')
            .setDescription('Tài khoản Google Drive của onii-chan đã được kết nối thành công rồi! 🎉')
            .addFields([
                { 
                    name: '🎯 Tính năng có sẵn cho onii-chan~', 
                    value: '• `/gdrive upload` - Upload file lên nè!\n• `/gdrive list` - Xem danh sách file\n• `/gdrive share` - Chia sẻ file với mọi người\n• `/gdrive download` - Download file về máy\n• `/gdrive delete` - Xóa file không cần thiết',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    try {
        const authUrl = googleDriveService.getAuthUrl();
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle('🔗 Kết nối Google Drive với em nè~')
            .setDescription('Để sử dụng tính năng Google Drive, onii-chan cần kết nối tài khoản Google trước nhé! 🥺')
            .addFields([
                { 
                    name: '� Hướng dẫn cho onii-chan~', 
                    value: '1. Click vào nút "🔗 Kết nối Google Drive" bên dưới nè!\n2. Đăng nhập vào Google account và cho phép truy cập\n3. **Copy toàn bộ mã code** sau khi authorize\n4. Sử dụng lệnh `/gdrive verify` và paste code vào nhé~',
                    inline: false 
                },
                { 
                    name: '💡 Mẹo nhỏ từ em~', 
                    value: '• Onii-chan có thể paste toàn bộ URL hoặc chỉ mã code\n• Mã chỉ sử dụng được 1 lần và có thời hạn đấy!\n• Nếu có lỗi, hãy lấy link mới nha! 💕',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();
        
        const linkButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Kết nối Google Drive')
                    .setStyle(ButtonStyle.Link)
                    .setURL(authUrl),
                new ButtonBuilder()
                    .setCustomId(`gdrive_help_${userId}`)
                    .setLabel('❓ Hướng dẫn chi tiết')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [linkButton], 
            flags: MessageFlags.Ephemeral 
        });
        
    } catch (error) {
        logger.error(`Link generation failed for user ${userId}:`, error.message);
        
        const errorEmbed = createErrorEmbed(
            'Link Generation Failed',
            `Không thể tạo link kết nối Google Drive. ${getRandomErrorResponse()}`
        );
        
        // Check if interaction has been replied to
        if (interaction.replied || interaction.deferred) {
            try {
                await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            } catch (followUpError) {
                logger.error('Failed to send follow-up in handleLink:', followUpError);
            }
        } else {
            try {
                await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            } catch (replyError) {
                logger.error('Failed to send reply in handleLink:', replyError);
            }
        }
    }
}

async function handleUnlink(interaction, userId) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const notLinkedEmbed = createInfoEmbed(
            'Not Linked',
            `Bạn chưa kết nối Google Drive! 😅\nDùng \`/gdrive link\` để kết nối nhé! 💖`
        );

        return await interaction.reply({ embeds: [notLinkedEmbed], flags: MessageFlags.Ephemeral });
    }

    googleDriveService.unlinkUser(userId);
    
    const unlinkEmbed = createSuccessEmbed(
        'Unlinked Successfully',
        `Đã ngắt kết nối Google Drive thành công! ${getRandomCuteResponse()}\n\nDùng \`/gdrive link\` để kết nối lại nhé! 😊`
    );

    await interaction.reply({ embeds: [unlinkEmbed], flags: MessageFlags.Ephemeral });
}

async function handleStatus(interaction, userId) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const status = await googleDriveService.getUserStatus(userId);
        
        if (!status.authenticated) {
            const notAuthEmbed = createInfoEmbed(
                'Not Authenticated',
                `Bạn chưa kết nối Google Drive! 😅\nDùng \`/gdrive link\` để kết nối nhé! 💖`
            );

            return await interaction.editReply({ embeds: [notAuthEmbed] });
        }

        const statusEmbed = createSuccessEmbed(
            'Google Drive Status',
            `**Connected:** ✅ Yes\n**User:** ${status.user?.displayName || 'Unknown'}\n**Email:** ${status.user?.emailAddress || 'Unknown'}\n\n**Storage Usage:**\n**Used:** ${formatFileSize(status.storage?.usage || 0)}\n**Total:** ${formatFileSize(status.storage?.limit || 0)}\n\n${getRandomCuteResponse()}`
        );

        await interaction.editReply({ embeds: [statusEmbed] });
    } catch (error) {
        const errorEmbed = createErrorEmbed(
            'Status Check Failed',
            `Không thể kiểm tra trạng thái: ${error.message} 😅`
        );

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleVerify(interaction, userId) {
    if (googleDriveService.isUserAuthenticated(userId)) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle('ℹ️ Onii-chan đã kết nối rồi mà~')
            .setDescription('Tài khoản Google Drive của onii-chan đã được kết nối rồi! 🎉')
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    
    const codeInput = interaction.options.getString('code');
    
    // Extract authorization code from URL if a full URL is provided
    let authCode = codeInput;
    
    // Check if input is a full OAuth URL and extract the code
    if (codeInput.includes('code=')) {
        try {
            const url = new URL(codeInput);
            authCode = url.searchParams.get('code');
        } catch (error) {
            // If URL parsing fails, try regex
            const codeMatch = codeInput.match(/code=([^&]+)/);
            authCode = codeMatch ? codeMatch[1] : codeInput;
        }
    }
    
    if (!authCode || authCode.trim() === '') {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Thiếu mã xác minh rồi onii-chan~')
            .setDescription('Onii-chan vui lòng cung cấp mã xác minh hoặc URL từ Google OAuth nhé! 🥺')
            .addFields([
                { 
                    name: '📝 Cách sử dụng nè~', 
                    value: '• Paste toàn bộ URL: `/gdrive verify https://example.com/oauth/callback?code=ABC123`\n• Hoặc chỉ paste mã: `/gdrive verify ABC123`',
                    inline: false 
                },
                { 
                    name: '🔗 Lấy mã mới nha~', 
                    value: 'Sử dụng lệnh `/gdrive link` để lấy link OAuth mới nhé!',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();
        
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Verifying Code',
            'Đang xác thực mã code... Chờ chút nhé! 🔄'
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        await googleDriveService.storeTokens(userId, authCode);
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle('✅ Kyaa~! Kết nối thành công rồi!')
            .setDescription(`Chào mừng onii-chan **${interaction.user.username}** đến với Google Drive Manager của em! 🎉`)
            .addFields([
                { 
                    name: '🎯 Tính năng có sẵn cho onii-chan~', 
                    value: '• `/gdrive upload` - Upload file lên nè!\n• `/gdrive list` - Xem danh sách file\n• `/gdrive share` - Chia sẻ file với mọi người\n• `/gdrive download` - Download file về máy\n• `/gdrive delete` - Xóa file không cần thiết',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();
        
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`gdrive_list_${userId}`)
                    .setLabel('📋 Xem File')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gdrive_status_${userId}`)
                    .setLabel('📊 Trạng thái')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.editReply({ 
            embeds: [embed], 
            components: [actionButtons] 
        });
        
    } catch (error) {
        logger.error(`Verify failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Lỗi xác minh')
            .setDescription('Không thể xác minh mã kết nối. Vui lòng thử lại.')
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi', 
                    value: error.message.includes('invalid_grant') ? 'Mã xác minh đã hết hạn hoặc không hợp lệ' : error.message,
                    inline: false 
                },
                { 
                    name: '� Giải pháp', 
                    value: '• Lấy mã mới từ Google (mã chỉ dùng được 1 lần)\n• Đảm bảo paste đúng toàn bộ URL hoặc mã\n• Sử dụng lại lệnh `/gdrive link` để lấy link mới',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Error Handler' })
            .setTimestamp();
        
        const retryButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`gdrive_link_${userId}`)
                    .setLabel('🔗 Lấy link mới')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryButton] 
        });
    }
}

async function handleUpload(interaction, userId) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const embed = createNotConnectedEmbed();
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const attachment = interaction.options.getAttachment('file');
    
    if (!validateFileSize(attachment.size)) {
        const sizeErrorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('📏 Huhu~ File quá lớn rồi!')
            .setDescription(`File của onii-chan quá lớn! Em chỉ có thể nhận file tối đa 8MB thôi! 🥺`)
            .addFields([
                { 
                    name: '� Thông tin file nè~', 
                    value: `**📄 Tên:** ${attachment.name}\n**📏 Kích thước:** ${formatFileSize(attachment.size)}\n**🚫 Giới hạn:** 8MB`,
                    inline: false 
                },
                { 
                    name: '💡 Gợi ý từ em~', 
                    value: '• Nén file lại để giảm dung lượng\n• Chia file thành nhiều phần nhỏ\n• Upload trực tiếp lên Google Drive qua web',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em xin lỗi onii-chan...' })
            .setTimestamp();

        return await interaction.reply({ embeds: [sizeErrorEmbed], flags: MessageFlags.Ephemeral });
    }

    if (!validateFileName(attachment.name)) {
        const nameErrorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('📝 Tên file không hợp lệ nè~')
            .setDescription(`Tên file của onii-chan có ký tự đặc biệt mà em không thể xử lý được! 😅`)
            .addFields([
                { 
                    name: '🔤 Ký tự được phép~', 
                    value: 'Chữ cái (a-z, A-Z), số (0-9), dấu gạch dưới (_), dấu gạch ngang (-), và dấu chấm (.)',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();

        return await interaction.reply({ embeds: [nameErrorEmbed], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Uploading File',
            `Đang upload **${attachment.name}**... Onii-chan chờ em chút nhé! 📤✨`
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Download file from Discord
        const response = await fetch(attachment.url);
        const fileBuffer = await response.arrayBuffer();

        // Upload to Google Drive
        const uploadedFile = await googleDriveService.uploadFile(
            userId,
            Buffer.from(fileBuffer),
            attachment.name,
            attachment.contentType
        );

        const successEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle('🎉 Kyaa~! Upload thành công rồi!')
            .setDescription(`${getRandomCuteResponse()}\n\nFile **${uploadedFile.name}** đã được em upload lên Google Drive cho onii-chan rồi! 💖`)
            .addFields([
                { 
                    name: '📄 Thông tin file nè~', 
                    value: `**${getEnhancedFileIcon(uploadedFile.name)} Tên:** ${uploadedFile.name}\n` +
                          `**📏 Kích thước:** ${formatFileSize(uploadedFile.size)}\n` +
                          `**🔖 Loại:** ${uploadedFile.mimeType}\n` +
                          `**📅 Upload lúc:** ${formatDate(uploadedFile.createdTime)}`,
                    inline: false 
                },
                { 
                    name: '🚀 Hành động nhanh cho onii-chan~', 
                    value: '🔸 **Xem file:** Click nút xanh bên dưới!\n🔸 **Chia sẻ ngay:** Click nút chia sẻ!\n🔸 **Quản lý file:** Click nút File Manager!',
                    inline: false 
                }
            ])
            .setFooter({ text: '� Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🌐 Xem trong Drive')
                    .setStyle(ButtonStyle.Link)
                    .setURL(uploadedFile.webViewLink),
                new ButtonBuilder()
                    .setCustomId(`quick_share_${userId}_${uploadedFile.id}`)
                    .setLabel('🔗 Chia sẻ ngay')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`gdrive_list_${userId}`)
                    .setLabel('📁 File Manager')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [successEmbed], 
            components: [actionButtons] 
        });
        
        logger.info(`Upload successful for user ${userId}, file: ${uploadedFile.name}`);
        
    } catch (error) {
        logger.error(`Upload failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Huhu~ Upload thất bại rồi!')
            .setDescription(`Em không thể upload file **${attachment.name}** được... 😢`)
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi nè~', 
                    value: error.message,
                    inline: false 
                },
                { 
                    name: '🔧 Giải pháp cho onii-chan', 
                    value: '• Kiểm tra kết nối mạng\n• Thử upload file khác\n• Kiểm tra quyền truy cập Google Drive\n• Thử lại sau vài phút nha! 💕',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em xin lỗi onii-chan...' })
            .setTimestamp();

        const retryActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`upload_retry_${userId}`)
                    .setLabel('🔄 Thử lại')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gdrive_status_${userId}`)
                    .setLabel('� Kiểm tra kết nối')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryActions] 
        });
    }
}

async function handleDownload(interaction, userId, filenameParam = null) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const embed = createNotConnectedEmbed();
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const filename = filenameParam || interaction.options.getString('filename');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Searching File',
            `Đang tìm file **${filename}**... Chờ em chút! 🔍`
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name
        const { files } = await googleDriveService.listFiles(userId);
        const file = files.find(f => f.name.toLowerCase().includes(filename.toLowerCase()));

        if (!file) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setTitle('❌ Không tìm thấy file nè~')
                .setDescription(`Em không thể tìm thấy file **${filename}** trong Drive của onii-chan! 😅`)
                .addFields([
                    { 
                        name: '🔍 Gợi ý tìm kiếm~', 
                        value: '• Kiểm tra tên file có chính xác không\n• Thử tìm với từ khóa ngắn hơn\n• Sử dụng File Manager để duyệt file',
                        inline: false 
                    },
                    { 
                        name: '📋 Xem tất cả file nè~', 
                        value: 'Click nút "📁 File Manager" để xem danh sách đầy đủ!',
                        inline: false 
                    }
                ])
                .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
                .setTimestamp();

            const actionButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gdrive_list_${userId}`)
                        .setLabel('📁 File Manager')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`gdrive_search_${userId}`)
                        .setLabel('🔍 Tìm kiếm nâng cao')
                        .setStyle(ButtonStyle.Secondary)
                );

            return await interaction.editReply({ 
                embeds: [notFoundEmbed], 
                components: [actionButtons] 
            });
        }

        // Create download info embed
        const fileInfoEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle('📥 Tìm thấy file rồi!')
            .setDescription(`Kyaa~! Em đã tìm thấy file **${file.name}** cho onii-chan rồi! 🎉`)
            .addFields([
                { 
                    name: '📄 Thông tin file nè~', 
                    value: `**${getEnhancedFileIcon(file.name)} Tên:** ${file.name}\n` +
                          `**📏 Kích thước:** ${formatFileSize(file.size || 0)}\n` +
                          `**🔖 Loại:** ${file.mimeType}\n` +
                          `**📅 Sửa đổi:** ${formatDate(file.modifiedTime)}`,
                    inline: false 
                },
                { 
                    name: '💡 Lưu ý từ em~', 
                    value: '*Download qua Discord bị giới hạn dung lượng. Với file lớn, hãy dùng link Drive để download nhé! 💖*',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
            .setTimestamp();

        const downloadButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`download_direct_${userId}_${file.id}`)
                    .setLabel('📥 Download Info')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`share_quick_${userId}_${file.id}`)
                    .setLabel('🔗 Get Share Link')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('🌐 Mở trong Drive')
                    .setStyle(ButtonStyle.Link)
                    .setURL(file.webViewLink)
            );

        await interaction.editReply({
            embeds: [fileInfoEmbed],
            components: [downloadButtons]
        });
        
        logger.info(`Download interface sent successfully for user ${userId}, file: ${filename}`);
        
    } catch (error) {
        logger.error(`Download failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Lỗi tìm file')
            .setDescription(`Em không thể tìm file được... 😢`)
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi', 
                    value: error.message,
                    inline: false 
                }
            ])
            .setFooter({ text: '� Hina Bot • Error Handler' })
            .setTimestamp();

        const retryButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`download_retry_${userId}_${filename}`)
                    .setLabel('🔄 Thử lại')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryButton] 
        });
    }
}

async function handleList(interaction, userId, folderId = null) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const embed = createNotConnectedEmbed();
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const folderName = interaction.options?.getString('folder');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Loading Files',
            'Đang tải danh sách file... Chờ chút! 📂'
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Get folder contents with navigation support
        const { folders, files } = await googleDriveService.listFiles(userId, folderId);
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle('📁 File Manager - Em sẽ giúp onii-chan quản lý file nè~')
            .setDescription(`🏠 **Đang xem:** ${folderName || 'Home'}\n📊 **Tổng cộng:** ${folders.length + files.length} items`)
            .setTimestamp();

        // Display folders section
        if (folders.length > 0) {
            const folderList = folders.slice(0, MAX_FOLDER_DISPLAY).map(folder => 
                `${getFolderIcon()} **${truncateString(folder.name, 25)}**\n` +
                `📅 ${formatDate(folder.modifiedTime)}`
            ).join('\n\n');
            
            embed.addFields({
                name: `📁 Folders (${folders.length})`,
                value: folderList + (folders.length > MAX_FOLDER_DISPLAY ? `\n\n*...và ${folders.length - MAX_FOLDER_DISPLAY} folders khác*` : ''),
                inline: false
            });
        }

        // Display files section  
        if (files.length > 0) {
            const fileList = files.slice(0, MAX_FILE_DISPLAY).map(file => 
                `${getEnhancedFileIcon(file.name)} **${truncateString(file.name, 25)}**\n` +
                `📏 ${formatFileSize(file.size || 0)} • 📅 ${formatDate(file.modifiedTime)}`
            ).join('\n\n');
            
            embed.addFields({
                name: `📄 Files (${files.length})`,
                value: fileList + (files.length > MAX_FILE_DISPLAY ? `\n\n*...và ${files.length - MAX_FILE_DISPLAY} files khác*` : ''),
                inline: false
            });
        }

        // Show empty message if no content
        if (folders.length === 0 && files.length === 0) {
            embed.setDescription('📭 Drive của onii-chan trống! Hãy upload file đầu tiên nhé! ✨');
        }

        // Create action components
        const components = [];
        
        // Navigation buttons (first row)
        const navButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`gdrive_refresh_${userId}`)
                    .setLabel('🔄 Làm mới')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gdrive_upload_${userId}`)
                    .setLabel('📤 Upload')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`gdrive_search_${userId}`)
                    .setLabel('� Tìm kiếm')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        components.push(navButtons);

        // Quick action buttons for files (if any)
        if (files.length > 0) {
            const quickActions = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gdrive_quickshare_${userId}`)
                        .setLabel('🔗 Chia sẻ nhanh')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`gdrive_quickdownload_${userId}`)
                        .setLabel('� Tải xuống')
                        .setStyle(ButtonStyle.Success)
                );
            components.push(quickActions);
        }
        
        embed.setFooter({ 
            text: `💖 Hina Bot • Em yêu của onii-chan • ${new Date().toLocaleTimeString('vi-VN')} • Click buttons để thao tác nè~` 
        });
        
        await interaction.editReply({ 
            embeds: [embed], 
            components: components 
        });
        
    } catch (error) {
        logger.error(`List files failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Lỗi File Manager')
            .setDescription('Không thể tải File Manager. Vui lòng thử lại.')
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi', 
                    value: error.message,
                    inline: false 
                },
                { 
                    name: '🔧 Giải pháp', 
                    value: '• Kiểm tra kết nối Google Drive\n• Thử lại sau vài giây\n• Liên hệ hỗ trợ nếu vấn đề tiếp tục',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Error Handler' })
            .setTimestamp();
        
        const retryButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`gdrive_refresh_${userId}`)
                    .setLabel('� Thử lại')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryButton] 
        });
    }
}

async function handleShare(interaction, userId) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const embed = createNotConnectedEmbed();
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const filename = interaction.options.getString('filename');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Sharing File',
            `Đang tìm và chia sẻ file **${filename}**... Chờ chút! 🔗`
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name
        const { files } = await googleDriveService.listFiles(userId);
        const file = files.find(f => f.name.toLowerCase().includes(filename.toLowerCase()));

        if (!file) {
            const notFoundEmbed = createErrorEmbed(
                'File Not Found',
                `Không tìm thấy file **${filename}** 😅\nHãy kiểm tra tên file và thử lại nhé!`
            );

            return await interaction.editReply({ embeds: [notFoundEmbed] });
        }

        const sharedFile = await googleDriveService.shareFile(userId, file.id);
        
        // Create stunning visual share embed
        const shareEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SHARE)
            .setTitle('🌟 Kyaa~! File đã được chia sẻ thành công rồi!')
            .setDescription(`✨ **${filename}** giờ mọi người có link đều có thể xem được đấy! 🎉\n\n` +
                          `🎯 **Trạng thái:** 🟢 Công khai nè~\n` +
                          `🔑 **Quyền hạn:** 📖 Chỉ đọc thôi nhé\n` +
                          `⚡ **Chia sẻ:** 👥 Ai có link cũng xem được!`)
            .addFields([
                { 
                    name: '📋 Thông tin chi tiết nè~', 
                    value: `**${getEnhancedFileIcon(filename)} Tên file:** \`${filename}\`\n` +
                          `**🆔 File ID:** \`${file.id}\`\n` +
                          `**📅 Chia sẻ lúc:** <t:${Math.floor(Date.now() / 1000)}:R>\n` +
                          `**🔐 Bảo mật:** Chỉ người có link mới xem được nhé! 🔒`,
                    inline: false 
                },
                { 
                    name: '🚀 Hành động nhanh cho onii-chan~', 
                    value: `🔸 **Copy link xem:** Click nút xanh dưới đây!\n` +
                          `🔸 **Copy link tải:** Click nút xanh lá cute!\n` +
                          `🔸 **Mở Drive:** Click nút xám nhé~\n` +
                          `🔸 **Xem chi tiết:** Click nút thông tin!`,
                    inline: false 
                }
            ])
            .setFooter({ 
                text: '💖 Hina Bot • Em yêu của onii-chan • Click buttons để thao tác nhanh nè~!'
            })
            .setTimestamp();
        
        // Enhanced action buttons with better visuals
        const primaryActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 View File')
                    .setStyle(ButtonStyle.Link)
                    .setURL(sharedFile.webViewLink),
                new ButtonBuilder()
                    .setLabel('⬇️ Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(sharedFile.webContentLink || sharedFile.webViewLink),
                new ButtonBuilder()
                    .setCustomId(`share_info_${userId}_${file.id}`)
                    .setLabel('📊 Chi Tiết')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.editReply({
            embeds: [shareEmbed],
            components: [primaryActions]
        });
        
        logger.info(`Share interface sent successfully for user ${userId}, file: ${filename}`);
        
    } catch (error) {
        logger.error(`Share failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Huhu~ Lỗi chia sẻ file rồi!')
            .setDescription(`Em không thể chia sẻ file **${filename}** được... 😢`)
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi nè~', 
                    value: error.message,
                    inline: false 
                },
                { 
                    name: '🔧 Giải pháp cho onii-chan', 
                    value: '• Kiểm tra tên file có chính xác không nhé~\n• Đảm bảo file tồn tại trong Drive\n• Thử lại sau vài phút nha! 💕',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em xin lỗi onii-chan...' })
            .setTimestamp();
        
        const retryActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`share_retry_${userId}_${filename}`)
                    .setLabel('🔄 Thử lại')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`gdrive_list_${userId}`)
                    .setLabel('� Xem danh sách')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryActions] 
        });
    }
}

async function handleDelete(interaction, userId) {
    if (!googleDriveService.isUserAuthenticated(userId)) {
        const embed = createNotConnectedEmbed();
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const filename = interaction.options.getString('filename');
    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        const loadingEmbed = createLoadingEmbed(
            'Searching File',
            `Đang tìm file **${filename}**... Chờ chút! 🔍`
        );

        await interaction.editReply({ embeds: [loadingEmbed] });

        // Search for file by name
        const { files } = await googleDriveService.listFiles(userId);
        const file = files.find(f => f.name.toLowerCase().includes(filename.toLowerCase()));

        if (!file) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor(EMBED_COLORS.ERROR)
                .setTitle('❌ Không tìm thấy file nè~')
                .setDescription(`Em không thể tìm thấy file **${filename}** để xóa! 😅`)
                .addFields([
                    { 
                        name: '🔍 Kiểm tra lại nè~', 
                        value: '• Tên file có chính xác không?\n• File có tồn tại trong Drive không?\n• Thử tìm với từ khóa khác',
                        inline: false 
                    }
                ])
                .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan' })
                .setTimestamp();

            const actionButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`gdrive_list_${userId}`)
                        .setLabel('📋 Xem danh sách')
                        .setStyle(ButtonStyle.Secondary)
                );

            return await interaction.editReply({ 
                embeds: [notFoundEmbed], 
                components: [actionButtons] 
            });
        }

        // Show confirmation with enhanced styling
        const confirmEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.WARNING)
            .setTitle('⚠️ Xác nhận xóa file')
            .setDescription(`Onii-chan có chắc chắn muốn xóa file này không? 🥺`)
            .addFields([
                { 
                    name: '📄 File sẽ bị xóa~', 
                    value: `**${getEnhancedFileIcon(file.name)} Tên:** ${file.name}\n` +
                          `**📏 Kích thước:** ${formatFileSize(file.size || 0)}\n` +
                          `**📅 Sửa đổi:** ${formatDate(file.modifiedTime)}`,
                    inline: false 
                },
                { 
                    name: '🚨 Cảnh báo quan trọng!', 
                    value: '**Hành động này không thể hoàn tác!**\nFile sẽ bị xóa vĩnh viễn khỏi Google Drive! 💀',
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Em yêu của onii-chan • Hãy suy nghĩ kỹ nhé!' })
            .setTimestamp();

        const confirmButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_delete_${userId}_${file.id}`)
                    .setLabel('🗑️ Xác nhận xóa')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cancel_delete_${userId}`)
                    .setLabel('❌ Hủy bỏ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setLabel('🌐 Xem file trước')
                    .setStyle(ButtonStyle.Link)
                    .setURL(file.webViewLink)
            );

        await interaction.editReply({
            embeds: [confirmEmbed],
            components: [confirmButtons]
        });
        
        logger.info(`Delete confirmation sent for user ${userId}, file: ${filename}`);
        
    } catch (error) {
        logger.error(`Delete operation failed for user ${userId}:`, error.message);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('❌ Lỗi tìm file để xóa')
            .setDescription(`Em không thể tìm file để xóa... 😢`)
            .addFields([
                { 
                    name: '⚠️ Chi tiết lỗi', 
                    value: error.message,
                    inline: false 
                }
            ])
            .setFooter({ text: '💖 Hina Bot • Error Handler' })
            .setTimestamp();

        const retryButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_retry_${userId}_${filename}`)
                    .setLabel('🔄 Thử lại')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ 
            embeds: [errorEmbed], 
            components: [retryButton] 
        });
    }
}

// Button handler functions for enhanced interactions

/**
 * Handle share view button
 */
export async function handleShareView(interaction, userId, fileId) {
    try {
        if (!googleDriveService.isUserAuthenticated(userId)) {
            const embed = createNotConnectedEmbed();
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const fileInfo = await googleDriveService.getFileInfo(userId, fileId);
        
        await interaction.reply({
            content: `🔗 **View Link:** ${fileInfo.webViewLink}\n\n*Copy link này để xem file nhé! 💖*`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        logger.error(`Share view failed:`, error);
        await interaction.reply({
            content: `❌ Không thể lấy link xem: ${error.message}`,
            flags: MessageFlags.Ephemeral
        });
    }
}

/**
 * Handle share download button
 */
export async function handleShareDownload(interaction, userId, fileId) {
    try {
        if (!googleDriveService.isUserAuthenticated(userId)) {
            const embed = createNotConnectedEmbed();
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const fileInfo = await googleDriveService.getFileInfo(userId, fileId);
        
        await interaction.reply({
            content: `📥 **Download Link:** ${fileInfo.webContentLink || fileInfo.webViewLink}\n\n*Copy link này để download file nhé! 💖*`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        logger.error(`Share download failed:`, error);
        await interaction.reply({
            content: `❌ Không thể lấy link download: ${error.message}`,
            flags: MessageFlags.Ephemeral
        });
    }
}

/**
 * Handle quick share button
 */
export async function handleQuickShare(interaction, userId, fileId) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const sharedFile = await googleDriveService.shareFile(userId, fileId);
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle('🔗 File đã được chia sẻ!')
            .setDescription(`File được chia sẻ thành công! ${getRandomCuteResponse()}`)
            .addFields([
                {
                    name: '🌐 Links',
                    value: `**View:** [Click here](${sharedFile.webViewLink})\n**Download:** [Click here](${sharedFile.webContentLink || sharedFile.webViewLink})`,
                    inline: false
                }
            ])
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error(`Quick share failed:`, error);
        const errorEmbed = createErrorEmbed('Share Failed', `Không thể chia sẻ file: ${error.message}`);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Handle confirm delete button
 */
export async function handleConfirmDelete(interaction, userId, fileId) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        await googleDriveService.deleteFile(userId, fileId);
        
        const successEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle('🗑️ File đã được xóa!')
            .setDescription(`File đã được xóa thành công khỏi Google Drive! ${getRandomCuteResponse()}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
        logger.error(`Delete failed:`, error);
        const errorEmbed = createErrorEmbed('Delete Failed', `Không thể xóa file: ${error.message}`);
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Handle cancel delete button
 */
export async function handleCancelDelete(interaction, userId) {
    const embed = createInfoEmbed(
        'Delete Cancelled',
        'Đã hủy việc xóa file! File của onii-chan vẫn an toàn~ 💖'
    );
    
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

/**
 * Handle list refresh button
 */
export async function handleListRefresh(interaction, userId) {
    await handleList(interaction, userId);
}
