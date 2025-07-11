import { EmbedBuilder } from 'discord.js';

export const Colors = {
    Success: 0x00ff00,
    Error: 0xff0000,
    Warning: 0xffa500,
    Info: 0x4285f4,
    Share: 0x00D4AA,
    Default: 0x5865F2
};

export const createEmbed = (options = {}) => {
    const embed = new EmbedBuilder()
        .setColor(options.color || Colors.Default)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    if (options.footer) embed.setFooter(options.footer);
    if (options.fields) {
        options.fields.forEach(field => {
            embed.addFields(field);
        });
    }

    return embed;
};

export const createSuccessEmbed = (title, description) => {
    return createEmbed({
        color: Colors.Success,
        title: `✅ ${title}`,
        description,
        footer: { text: '💖 Hina Bot • Success' }
    });
};

export const createErrorEmbed = (title, description) => {
    return createEmbed({
        color: Colors.Error,
        title: `❌ ${title}`,
        description,
        footer: { text: '💖 Hina Bot • Error' }
    });
};

export const createWarningEmbed = (title, description) => {
    return createEmbed({
        color: Colors.Warning,
        title: `⚠️ ${title}`,
        description,
        footer: { text: '💖 Hina Bot • Warning' }
    });
};

export const createInfoEmbed = (title, description) => {
    return createEmbed({
        color: Colors.Info,
        title: `ℹ️ ${title}`,
        description,
        footer: { text: '💖 Hina Bot • Info' }
    });
};

export const createLoadingEmbed = (title, description) => {
    return createEmbed({
        color: Colors.Info,
        title: `🔄 ${title}`,
        description,
        footer: { text: '💖 Hina Bot • Loading' }
    });
};
