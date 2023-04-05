const { Client, ChatInputCommandInteraction, AttachmentBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	name: "purge",
	description: "Zbriše sporočila",
	category: "Utility",
	UserPerms: ["ManageGuild"],
	options: [
		{
			name: "količina",
			description: "Izberi kolko sporočil naj bo izbrisano.",
			required: true,
			type: 4,
		},
	],

	/**
	 *
	 *  @param { ChatInputCommandInteraction } interaction
	 *  @param { Client } client}
	 */
	async execute(interaction, client, language) {
		const { options, channel } = interaction;
		let number = options.getInteger("količina");

		const embed = new EmbedBuilder().setColor("Blurple").setDescription(
			`${client.i18n.get(language, "utilities", "purge_message", {
				number: number,
			})}`,
		);

		await channel.bulkDelete(number);

		interaction.reply({ embeds: [embed] });
	},
};
