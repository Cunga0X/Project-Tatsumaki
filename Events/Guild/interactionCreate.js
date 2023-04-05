const { Client, CommandInteraction, InteractionType, EmbedBuilder, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } = require("discord.js");
const { ApplicationCommand } = InteractionType;
const Reply = require("../../Systems/Reply");
const GLang = require("../../Models/Language.js");

module.exports = {
	name: "interactionCreate",

	/**
	 * @param {CommandInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const { user, guild, commandName, member, type } = interaction;
		await GLang.findOne({ guild: interaction.guild.id }, async (err, data) => {
			if (!data) {
				GLang.create({
					guild: guild.id,
					language: "en",
				});
			}
		});
		const guildModel = await GLang.findOne({ guild: interaction.guild.id });
		const { language } = guildModel;

		if (!guild || user.bot) return;

		//! Slash Command Interactions
		if (type == ApplicationCommand) {
			const command = client.commands.get(commandName);

			const no_command = new EmbedBuilder().setColor("Red").setDescription(`${client.i18n.get(language, "interaction", "no_command_error")}`);
			const user_no_perm = new EmbedBuilder().setDescription(
				`${client.i18n.get(language, "interaction", "user_missing_perm", {
					user_permission: command.UserPerms,
				})}`,
			);
			const bot_no_perm = new EmbedBuilder().setColor("Red").setDescription(
				`${client.i18n.get(language, "interaction", "bot_missing_perm", {
					bot_permission: command.BotPerms,
				})}`,
			);

			if (!command) return interaction.reply({ embeds: [no_command], ephemeral: true }) && client.commands.delete(commandName);

			if (command.UserPerms && command.UserPerms.length !== 0) if (!member.permissions.has(command.UserPerms)) return interaction.reply({ embeds: [user_no_perm], ephemeral: true });

			if (command.BotPerms && command.BotPerms.length !== 0) if (!guild.members.me.permissions.has(command.BotPerms)) return interaction.reply({ embeds: [bot_no_perm], ephemeral: true });

			command.execute(interaction, client, language);
		}
		//! Button Interactions
		if (type == ButtonInteraction) {
		}
		//! String Menu Interactions
		if (type == StringSelectMenuInteraction) {
		}
		//! Modal Submit Interactions
		if (type == ModalSubmitInteraction) {
		}
	},
};
