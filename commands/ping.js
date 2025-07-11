import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { 
    createSuccessEmbed, 
    createInfoEmbed,
    Colors
} from '../utils/embeds.js';
import { formatFileSize, getRandomCuteResponse } from '../utils/helpers.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot'),

    async execute(interaction) {
        const start = Date.now();
        
        await interaction.reply({
            embeds: [createInfoEmbed('Pinging...', 'Đang kiểm tra ping... 🏓')],
            ephemeral: true
        });

        const end = Date.now();
        const apiLatency = end - start;
        const wsLatency = interaction.client.ws.ping;

        const pingEmbed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(Colors.Success)
            .setDescription(`${getRandomCuteResponse()}`)
            .addFields(
                {
                    name: '📡 API Latency',
                    value: `${apiLatency}ms`,
                    inline: true
                },
                {
                    name: '🌐 WebSocket Latency',
                    value: `${wsLatency}ms`,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: getLatencyStatus(Math.max(apiLatency, wsLatency)),
                    inline: true
                }
            )
            .setFooter({ text: '💖 Hina Bot • Ping' })
            .setTimestamp();

        await interaction.editReply({ embeds: [pingEmbed] });
    }
};

function getLatencyStatus(latency) {
    if (latency < 100) return '🟢 Excellent';
    if (latency < 200) return '🟡 Good';
    if (latency < 500) return '🟠 Fair';
    return '🔴 Poor';
}
