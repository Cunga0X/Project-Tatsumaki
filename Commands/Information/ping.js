const { Client, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");

module.exports = {
	name: "ping",
	description: "Displays the bot's current latency",
	category: "Information",

	/**
	 * @param {Client} client
	 * @param {ChatInputCommandInteraction} interaction
	 */
	async execute(interaction, client) {
		await interaction.deferReply;
		if (client.ws.ping <= 100) {
			const pingColor = "#5fb041";
			const embed = new EmbedBuilder()
				.setColor(pingColor)
				.setTitle(`Latency 🏓`)
				.setDescription(`**API Latency :** ${client.ws.ping} ms\n**Client Ping :** ${Date.now() - interaction.createdTimestamp} ms`);

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else if (client.ws.ping >= 100 && client.ws.ping <= 200) {
			const pingColor = "#ffdb29";
			const embed = new EmbedBuilder()
				.setColor(pingColor)
				.setTitle(`Latency 🏓`)
				.setDescription(`**API Latency :** ${client.ws.ping} ms\n**Client Ping :** ${Date.now() - interaction.createdTimestamp} ms`);

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else {
			const pingColor = "#ff0000";
			const embed = new EmbedBuilder()
				.setColor(pingColor)
				.setTitle(`Latency 🏓`)
				.setDescription(`**API Latency :** ${client.ws.ping} ms\n**Client Ping :** ${Date.now() - interaction.createdTimestamp} ms`);

			await interaction.editReply({
				embeds: [embed],
				ephemeral: true,
			});
		}
	},
};
