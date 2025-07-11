import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { 
    createInfoEmbed,
    Colors
} from '../utils/embeds.js';
import { getRandomCuteResponse } from '../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem hướng dẫn sử dụng bot'),

    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('💖 Hina Bot - Help Center')
            .setDescription(`Xin chào! Mình là Hina Bot! ${getRandomCuteResponse()}\n\nMình có thể giúp bạn quản lý Google Drive, tìm kiếm GitHub, và search web! 🌟`)
            .setColor(Colors.Info)
            .setThumbnail(interaction.client.user.avatarURL())
            .setFooter({ text: '💖 Hina Bot • Help Center' })
            .setTimestamp();

        // Add feature categories
        helpEmbed.addFields(
            {
                name: '🗂️ Google Drive',
                value: 'Quản lý file Google Drive, upload, download, share file',
                inline: true
            },
            {
                name: '🐙 GitHub',
                value: 'Xem thông tin user, tìm kiếm repo, xem chi tiết repository',
                inline: true
            },
            {
                name: '🔍 Web Search',
                value: 'Tìm kiếm web, hình ảnh, tin tức, video, tài liệu',
                inline: true
            },
            {
                name: '🛠️ Utilities',
                value: 'Ping, stats, help và các tiện ích khác',
                inline: true
            },
            {
                name: '🎨 Interactive UI',
                value: 'File manager, button interactions, select menus',
                inline: true
            },
            {
                name: '💡 Tips',
                value: 'Dùng slash commands (/) để xem tất cả lệnh!',
                inline: true
            }
        );

        const helpSelect = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Chọn category để xem chi tiết...')
            .addOptions([
                {
                    label: '🗂️ Google Drive Commands',
                    description: 'Hướng dẫn sử dụng Google Drive',
                    value: 'gdrive',
                    emoji: '🗂️'
                },
                {
                    label: '🐙 GitHub Commands',
                    description: 'Hướng dẫn sử dụng GitHub',
                    value: 'github',
                    emoji: '🐙'
                },
                {
                    label: '🔍 Search Commands',
                    description: 'Hướng dẫn tìm kiếm web',
                    value: 'search',
                    emoji: '🔍'
                },
                {
                    label: '🛠️ Utility Commands',
                    description: 'Các lệnh tiện ích khác',
                    value: 'utilities',
                    emoji: '🛠️'
                },
                {
                    label: '🎨 Interactive Features',
                    description: 'Tính năng tương tác',
                    value: 'interactive',
                    emoji: '🎨'
                }
            ]);

        const helpRow = new ActionRowBuilder()
            .addComponents(helpSelect);

        const linkRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('📚 Documentation')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/your-repo/hina-bot-v2'),
                new ButtonBuilder()
                    .setLabel('🐛 Report Bug')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/your-repo/hina-bot-v2/issues'),
                new ButtonBuilder()
                    .setLabel('💖 Support')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
            );

        await interaction.reply({
            embeds: [helpEmbed],
            components: [helpRow, linkRow],
            ephemeral: true
        });
    }
};
