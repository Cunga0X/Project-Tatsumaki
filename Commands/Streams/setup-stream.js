const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, Client, ButtonStyle } = require("discord.js");
const Streamer = require("../../Models/Streamer");

module.exports = {
	name: "stream-setup",
	description: "Setup Channels for streamers",
	category: "Moderation",
	UserPerms: ["ManageGuild"],
	options: [
		{
			name: "channel",
			description: "Channel for streamer message",
			required: true,
			type: 7,
		},
		{
			name: "channel_notify",
			description: "Channel for new Streamer requests",
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
		const channel_notify = options.getChannel("channel_notify");

		const embed = new EmbedBuilder()
			.setColor("Green")
			.setTitle(`${client.i18n.get(language, "streams", "streams_msg_title")}`)
			.setDescription(`${client.i18n.get(language, "streams", "stream_message")}`)
			.setFooter({ text: `Support ${interaction.guild.name}` });
		const buttons = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Success)
				.setCustomId("streamer-req")
				.setLabel(`${client.i18n.get(language, "streams", "request_button_label")}`),
		);
		const m = await channel.send({ embeds: [embed], components: [buttons] });
		Streamer.findOne({ Guild: guild.id, RequestID: "streamer-request" }, async (err, data) => {
			if (!data) {
				Streamer.create({
					Guild: guild.id,
					ChannelID: channel.id,
					MessageID: m.id,
					RequestID: "streamer-request",
					Notify: channel_notify.id,
				});
			} else {
				const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "streams", "setup_error")}`);
				const em = await interaction.reply({ embeds: [embed], ephemeral: true });
				setTimeout(() => {
					em.delete();
				}, 4000);
			}
		});
		const embed_success = new EmbedBuilder().setColor("Green").setDescription(
			`${client.i18n.get(language, "streams", "setup_success", {
				channel: channel.name,
				notifications: channel_notify.name,
			})}`,
		);
		const es = await interaction.reply({ embeds: [embed_success], ephemeral: true });
		setTimeout(() => {
			es.delete();
		}, 6000);
	},
};
