const { Client, ChatInputCommandInteraction, AttachmentBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	name: "purge",
	description: "Bulk delete messages.",
	category: "Utility",
	UserPerms: ["ManageGuild"],
	options: [
		{
			name: "number",
			description: "How much messages to delete?",
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
		let number = options.getInteger("number");

		const embed = new EmbedBuilder().setColor("Blurple").setDescription(
			`${client.i18n.get(language, "utilities", "purge_message", {
				number: number,
			})}`,
		);

		await channel.bulkDelete(number);

		const m = await interaction.reply({ embeds: [embed] });
		setTimeout(() => {
			m.delete();
		}, 4000);
	},
};
