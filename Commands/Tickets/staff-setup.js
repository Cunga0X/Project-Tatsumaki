const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChatInputCommandInteraction, Client, GuildMember } = require("discord.js");
const Ticket = require("../../Models/Ticket.js");

module.exports = {
	name: "staff-setup",
	description: "Staff-Ticket-System setup.",
	category: "Moderation",
	UserPerms: ["ManageGuild"],
	options: [
		{
			name: "channel",
			description: "Channel for ticket message",
			required: true,
			type: 7,
		},
		{
			name: "category",
			description: "Category for new tickets",
			required: true,
			type: 7,
		},
		{
			name: "notifications",
			description: "Channel for new Staff Applications",
			required: true,
			type: 7,
		},
	],
	/**
	 * @param {Client} client
	 * @param {GuildMember} member
	 * @param {ChatInputCommandInteraction} interaction
	 */
	async execute(interaction, client, language) {
		const { options, guild } = interaction;
		const channel = options.getChannel("channel");
		const category = options.getChannel("category");
		const notifications = options.getChannel("notifications");

		const embed = new EmbedBuilder()
			.setColor("Green")
			.setTitle(`${client.i18n.get(language, "tickets", "staff_ticket_title")}`)
			.setDescription(`${client.i18n.get(language, "tickets", "staff_ticket_message")}`)
			.setFooter({ text: `Osebje ${interaction.guild.name}` });
		const menu = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("select-staff")
				.setMaxValues(1)
				.setPlaceholder(`${client.i18n.get(language, "tickets", "staff_ticket_placeholder")}`)
				.addOptions(
					{
						label: `${client.i18n.get(language, "tickets", "helper_label")}`,
						value: `helper`,
					},
					{
						label: `${client.i18n.get(language, "tickets", "builder_label")}`,
						value: `builder`,
					},
					{
						label: `${client.i18n.get(language, "tickets", "developer_label")}`,
						value: `developer`,
					},
				),
		);
		const m = await channel.send({ embeds: [embed], components: [menu] });
		Ticket.findOne({ Guild: guild.id, Ticket: "staff-ticket-message" }, async (err, data) => {
			if (!data) {
				Ticket.create({
					Guild: guild.id,
					Channel: category.id,
					ChannelID: channel.id,
					Ticket: "staff-ticket-message",
					MessageID: m.id,
					Notify: notifications.id,
				});
			} else {
				const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "tickets", "setup_error")}`);
				const m = await interaction.reply({ embeds: [embed], ephemeral: true });
				setTimeout(() => {
					m.delete();
				}, 4000);
			}
		});
		const embeds = new EmbedBuilder().setColor("Green").setDescription(
			`${client.i18n.get(language, "tickets", "setup_success", {
				channel: channel.name,
				category: category.name,
			})}`,
		);
		const ms = await interaction.reply({ embeds: [embeds], ephemeral: true });
		setTimeout(() => {
			ms.delete();
		}, 4000);
	},
};
