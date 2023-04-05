const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client } = require("discord.js");
const Ticket = require("../../Models/Ticket.js");

module.exports = {
	name: "staff-manager",
	description: "Staff Manager SetUp.",
	category: "Moderation",
	UserPerms: ["ManageGuild"],
	options: [
		{
			name: "channel",
			description: "Channel for ticket message",
			required: true,
			type: 7,
		},
	],
	/**
	 * @param {Client} client
	 * @param {ChatInputCommandInteraction} interaction
	 */
	async execute(interaction, client, language) {
		const { options, guild } = interaction;
		const channel = options.getChannel("channel");

		const embed = new EmbedBuilder()
			.setColor("Green")
			.setTitle("Staff Ticket Manager")
			.setDescription(`${client.i18n.get(language, "tickets", "staff_manager_message")}`)
			.setFooter({ text: `Staff ${interaction.guild.name}` });
		const buttons = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("ticket-enable")
				.setLabel(`${client.i18n.get(language, "tickets", "staff_button_enable")}`)
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId("ticket-disable")
				.setLabel(`${client.i18n.get(language, "tickets", "staff_button_disable")}`)
				.setStyle(ButtonStyle.Danger),
		);
		const m = await channel.send({ embeds: [embed], components: [buttons] });
		Ticket.findOne({ Guild: guild.id, Ticket: "staff-ticket-manager" }, async (err, data) => {
			if (!data) {
				Ticket.create({
					Guild: guild.id,
					Channel: channel.id,
					Ticket: "staff-ticket-manager",
					MessageID: m.id,
				});
			} else {
				const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "tickets", "staff_manager_error")}`);
				const m = await interaction.reply({ embeds: [embed], ephemeral: true });
				setTimeout(() => {
					m.delete();
				}, 4000);
			}
		});
		const embeds = new EmbedBuilder().setColor("Green").setDescription(`${client.i18n.get(language, "tickets", "staff_manager_success")}`);
		const msg = await interaction.reply({ embeds: [embeds], ephemeral: true });
		setTimeout(() => {
			msg.delete();
		}, 4000);
	},
};
