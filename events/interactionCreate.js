import { Events } from 'discord.js';
import { createLogger } from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embeds.js';

const logger = createLogger();

export default {
    name: Events.InteractionCreate,
    execute: async (interaction) => {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // Check cooldowns
            const { cooldowns } = interaction.client;
            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Map());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    const errorEmbed = createErrorEmbed(
                        'Cooldown Active',
                        `Chờ chút nhé! Lệnh này có thể dùng lại sau <t:${expiredTimestamp}:R> 😊`
                    );
                    return interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
                logger.info(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
            } catch (error) {
                logger.error(`Error executing command ${interaction.commandName}:`, error);
                
                const errorEmbed = createErrorEmbed(
                    'Command Error',
                    `Oops! Có lỗi xảy ra khi thực hiện lệnh 😅\nVui lòng thử lại sau nhé! 💖`
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            try {
                const customId = interaction.customId;
                const [action, ...params] = customId.split('_');

                // Dynamic import to prevent circular dependencies
                const { handleButtonInteraction } = await import('../handlers/interactionHandler.js');
                await handleButtonInteraction(interaction, action, params);
                
            } catch (error) {
                logger.error(`Error handling button interaction:`, error);
                
                const errorEmbed = createErrorEmbed(
                    'Button Error',
                    `Oops! Có lỗi xảy ra 😅\nVui lòng thử lại nhé! 💖`
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }
        
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            try {
                const customId = interaction.customId;
                const [action, ...params] = customId.split('_');

                // Dynamic import to prevent circular dependencies
                const { handleSelectMenuInteraction } = await import('../handlers/interactionHandler.js');
                await handleSelectMenuInteraction(interaction, action, params);
                
            } catch (error) {
                logger.error(`Error handling select menu interaction:`, error);
                
                const errorEmbed = createErrorEmbed(
                    'Select Menu Error',
                    `Oops! Có lỗi xảy ra 😅\nVui lòng thử lại nhé! 💖`
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }
    }
};
