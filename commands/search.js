import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import searchService from '../services/search.js';
import { 
    createSuccessEmbed, 
    createErrorEmbed, 
    createInfoEmbed, 
    createLoadingEmbed,
    Colors
} from '../utils/embeds.js';
import { 
    truncateString,
    getRandomCuteResponse,
    getRandomErrorResponse
} from '../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Tìm kiếm trên web với Google')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Từ khóa tìm kiếm')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Loại tìm kiếm')
                .setRequired(false)
                .addChoices(
                    { name: '🌐 Web Search', value: 'web' },
                    { name: '🖼️ Image Search', value: 'image' },
                    { name: '📰 News Search', value: 'news' },
                    { name: '🎥 Video Search', value: 'video' },
                    { name: '📄 Document Search', value: 'document' }
                )
        )
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Số lượng kết quả (tối đa 10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const searchType = interaction.options.getString('type') || 'web';
        const limit = interaction.options.getInteger('limit') || 5;

        // Validate query
        const validation = searchService.validateQuery(query);
        if (!validation.valid) {
            const errorEmbed = createErrorEmbed(
                'Invalid Query',
                `${validation.error} 😅\nHãy thử lại với từ khóa khác nhé! 💖`
            );

            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const loadingEmbed = createLoadingEmbed(
                'Searching',
                `Đang tìm kiếm **${query}**... Chờ chút! 🔍`
            );

            await interaction.editReply({ embeds: [loadingEmbed] });

            let results;
            let embed;

            switch (searchType) {
                case 'web':
                    results = await searchService.searchWeb(query, { num: limit });
                    embed = createWebSearchEmbed(results, query);
                    break;
                case 'image':
                    results = await searchService.searchImages(query, { num: limit });
                    embed = createImageSearchEmbed(results, query);
                    break;
                case 'news':
                    results = await searchService.searchNews(query, { num: limit });
                    embed = createNewsSearchEmbed(results, query);
                    break;
                case 'video':
                    results = await searchService.searchVideos(query, { num: limit });
                    embed = createVideoSearchEmbed(results, query);
                    break;
                case 'document':
                    results = await searchService.searchDocuments(query, 'pdf', { num: limit });
                    embed = createDocumentSearchEmbed(results, query);
                    break;
                default:
                    results = await searchService.searchWeb(query, { num: limit });
                    embed = createWebSearchEmbed(results, query);
            }

            const components = createSearchComponents(results, searchType);

            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } catch (error) {
            const errorEmbed = createErrorEmbed(
                'Search Failed',
                `${getRandomErrorResponse()}\nLỗi: ${error.message}`
            );

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

function createWebSearchEmbed(results, query) {
    const embed = new EmbedBuilder()
        .setTitle(`🔍 Search Results for "${query}"`)
        .setColor(Colors.Info)
        .setTimestamp()
        .setFooter({ text: `💖 Hina Bot • Web Search • ${results.totalResults} results in ${results.searchTime}s` });

    if (results.items.length === 0) {
        embed.setDescription(`Không tìm thấy kết quả nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`);
        return embed;
    }

    embed.setDescription(`Tìm thấy ${results.items.length} kết quả! ${getRandomCuteResponse()}`);

    // Add search results
    results.items.slice(0, 5).forEach((item, index) => {
        let description = item.snippet;
        if (description.length > 200) {
            description = description.substring(0, 200) + '...';
        }

        embed.addFields({
            name: `${index + 1}. ${truncateString(item.title, 50)}`,
            value: `${description}\n[🔗 ${item.displayLink}](${item.link})`,
            inline: false
        });
    });

    // Add thumbnail if available
    if (results.items[0]?.thumbnail?.src) {
        embed.setThumbnail(results.items[0].thumbnail.src);
    }

    return embed;
}

function createImageSearchEmbed(results, query) {
    const embed = new EmbedBuilder()
        .setTitle(`🖼️ Image Search Results for "${query}"`)
        .setColor(Colors.Info)
        .setTimestamp()
        .setFooter({ text: `💖 Hina Bot • Image Search • ${results.totalResults} results in ${results.searchTime}s` });

    if (results.items.length === 0) {
        embed.setDescription(`Không tìm thấy hình ảnh nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`);
        return embed;
    }

    // Use first image as main image
    const firstImage = results.items[0];
    if (firstImage.image?.thumbnailLink) {
        embed.setImage(firstImage.image.thumbnailLink);
    }

    embed.setDescription(`**${firstImage.title}**\n[🔗 View Original](${firstImage.link})\n\n${getRandomCuteResponse()}`);

    // Add other images as fields
    if (results.items.length > 1) {
        const imageList = results.items.slice(1, 4).map((item, index) => 
            `**${index + 2}.** [${truncateString(item.title, 30)}](${item.link})`
        ).join('\n');

        embed.addFields({
            name: '🖼️ More Images',
            value: imageList,
            inline: false
        });
    }

    return embed;
}

function createNewsSearchEmbed(results, query) {
    const embed = new EmbedBuilder()
        .setTitle(`📰 News Search Results for "${query}"`)
        .setColor(Colors.Info)
        .setTimestamp()
        .setFooter({ text: `💖 Hina Bot • News Search • ${results.totalResults} results in ${results.searchTime}s` });

    if (results.items.length === 0) {
        embed.setDescription(`Không tìm thấy tin tức nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`);
        return embed;
    }

    embed.setDescription(`Tìm thấy ${results.items.length} tin tức! ${getRandomCuteResponse()}`);

    // Add news results
    results.items.slice(0, 5).forEach((item, index) => {
        let description = item.snippet;
        if (description.length > 150) {
            description = description.substring(0, 150) + '...';
        }

        embed.addFields({
            name: `📰 ${truncateString(item.title, 50)}`,
            value: `${description}\n[🔗 ${item.displayLink}](${item.link})`,
            inline: false
        });
    });

    return embed;
}

function createVideoSearchEmbed(results, query) {
    const embed = new EmbedBuilder()
        .setTitle(`🎥 Video Search Results for "${query}"`)
        .setColor(Colors.Info)
        .setTimestamp()
        .setFooter({ text: `💖 Hina Bot • Video Search • ${results.totalResults} results in ${results.searchTime}s` });

    if (results.items.length === 0) {
        embed.setDescription(`Không tìm thấy video nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`);
        return embed;
    }

    embed.setDescription(`Tìm thấy ${results.items.length} video! ${getRandomCuteResponse()}`);

    // Add video results
    results.items.slice(0, 5).forEach((item, index) => {
        let description = item.snippet;
        if (description.length > 150) {
            description = description.substring(0, 150) + '...';
        }

        embed.addFields({
            name: `🎥 ${truncateString(item.title, 50)}`,
            value: `${description}\n[🔗 Watch Video](${item.link})`,
            inline: false
        });
    });

    return embed;
}

function createDocumentSearchEmbed(results, query) {
    const embed = new EmbedBuilder()
        .setTitle(`📄 Document Search Results for "${query}"`)
        .setColor(Colors.Info)
        .setTimestamp()
        .setFooter({ text: `💖 Hina Bot • Document Search • ${results.totalResults} results in ${results.searchTime}s` });

    if (results.items.length === 0) {
        embed.setDescription(`Không tìm thấy tài liệu nào cho "${query}" 😅\nHãy thử từ khóa khác nhé! 🤔`);
        return embed;
    }

    embed.setDescription(`Tìm thấy ${results.items.length} tài liệu! ${getRandomCuteResponse()}`);

    // Add document results
    results.items.slice(0, 5).forEach((item, index) => {
        let description = item.snippet;
        if (description.length > 150) {
            description = description.substring(0, 150) + '...';
        }

        embed.addFields({
            name: `📄 ${truncateString(item.title, 50)}`,
            value: `${description}\n[🔗 Download](${item.link})`,
            inline: false
        });
    });

    return embed;
}

function createSearchComponents(results, searchType) {
    const components = [];

    // Add search type selector
    const searchTypeMenu = new StringSelectMenuBuilder()
        .setCustomId('searchtype_select')
        .setPlaceholder('Chọn loại tìm kiếm khác...')
        .addOptions([
            {
                label: '🌐 Web Search',
                description: 'Tìm kiếm web thông thường',
                value: 'web',
                default: searchType === 'web'
            },
            {
                label: '🖼️ Image Search',
                description: 'Tìm kiếm hình ảnh',
                value: 'image',
                default: searchType === 'image'
            },
            {
                label: '📰 News Search',
                description: 'Tìm kiếm tin tức',
                value: 'news',
                default: searchType === 'news'
            },
            {
                label: '🎥 Video Search',
                description: 'Tìm kiếm video',
                value: 'video',
                default: searchType === 'video'
            },
            {
                label: '📄 Document Search',
                description: 'Tìm kiếm tài liệu',
                value: 'document',
                default: searchType === 'document'
            }
        ]);

    const selectRow = new ActionRowBuilder()
        .addComponents(searchTypeMenu);

    components.push(selectRow);

    // Add action buttons for top results
    if (results.items.length > 0) {
        const actionRow = new ActionRowBuilder();
        
        // Add buttons for top 3 results
        results.items.slice(0, 3).forEach((item, index) => {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setLabel(`🔗 Result ${index + 1}`)
                    .setStyle(ButtonStyle.Link)
                    .setURL(item.link)
            );
        });

        if (actionRow.components.length > 0) {
            components.push(actionRow);
        }
    }

    return components;
}
