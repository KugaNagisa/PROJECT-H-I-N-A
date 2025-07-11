import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { 
    createSuccessEmbed,
    Colors
} from '../utils/embeds.js';
import { formatFileSize, getRandomCuteResponse } from '../utils/helpers.js';
import { getSchedulerStatus } from '../services/scheduler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Xem thống kê bot'),

    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const schedulerStatus = getSchedulerStatus();

        // Calculate uptime
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 Bot Statistics')
            .setDescription(`Thống kê chi tiết của Hina Bot! ${getRandomCuteResponse()}`)
            .setColor(Colors.Success)
            .setThumbnail(client.user.avatarURL())
            .setFooter({ text: '💖 Hina Bot • Statistics' })
            .setTimestamp();

        // Bot info
        statsEmbed.addFields(
            {
                name: '🤖 Bot Information',
                value: `**Name:** ${client.user.tag}\n**ID:** ${client.user.id}\n**Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`,
                inline: true
            },
            {
                name: '📡 Connection',
                value: `**Status:** 🟢 Online\n**Ping:** ${client.ws.ping}ms\n**Uptime:** ${uptimeString}`,
                inline: true
            },
            {
                name: '🌐 Servers',
                value: `**Guilds:** ${client.guilds.cache.size}\n**Channels:** ${client.channels.cache.size}\n**Users:** ${client.users.cache.size}`,
                inline: true
            }
        );

        // Memory usage
        statsEmbed.addFields(
            {
                name: '💾 Memory Usage',
                value: `**Used:** ${formatFileSize(memoryUsage.heapUsed)}\n**Total:** ${formatFileSize(memoryUsage.heapTotal)}\n**RSS:** ${formatFileSize(memoryUsage.rss)}\n**External:** ${formatFileSize(memoryUsage.external)}`,
                inline: true
            },
            {
                name: '🎯 Commands',
                value: `**Loaded:** ${client.commands.size}\n**Cooldowns:** ${client.cooldowns.size}\n**Sessions:** ${client.userSessions.size}`,
                inline: true
            },
            {
                name: '⚙️ System',
                value: `**Node.js:** ${process.version}\n**Platform:** ${process.platform}\n**Architecture:** ${process.arch}`,
                inline: true
            }
        );

        // Scheduler status
        const schedulerTasks = Object.keys(schedulerStatus).length;
        const runningTasks = Object.values(schedulerStatus).filter(task => task.running).length;

        statsEmbed.addFields(
            {
                name: '🔄 Scheduler',
                value: `**Tasks:** ${schedulerTasks}\n**Running:** ${runningTasks}\n**Status:** ${schedulerTasks > 0 ? '🟢 Active' : '🔴 Inactive'}`,
                inline: true
            },
            {
                name: '🎨 Features',
                value: `**Google Drive:** ✅\n**Web Search:** ✅\n**Interactive UI:** ✅`,
                inline: true
            },
            {
                name: '📈 Performance',
                value: `**CPU Usage:** ${Math.round(process.cpuUsage().user / 1000)}ms\n**Memory Limit:** 150MB\n**Health:** ${getHealthStatus(memoryUsage.heapUsed, client.ws.ping)}`,
                inline: true
            }
        );

        await interaction.reply({
            embeds: [statsEmbed],
            ephemeral: true
        });
    }
};

function getHealthStatus(memoryUsed, ping) {
    const memoryMB = memoryUsed / 1024 / 1024;
    
    if (memoryMB < 80 && ping < 100) return '🟢 Excellent';
    if (memoryMB < 120 && ping < 200) return '🟡 Good';
    if (memoryMB < 150 && ping < 500) return '🟠 Fair';
    return '🔴 Poor';
}
