const { ChatInputCommandInteraction, Client, EmbedBuilder } = require("discord.js");
const DontAt = require("../../Models/DontAt");

module.exports = {
	name: "dontat",
	description: "Enable or Disable don't at me mode",
	category: "Utility",
	UserPerms: ["ManageGuild"],
	/**
	 * @param {Message} message
	 * @param {Client} client
	 * @param {ChatInputCommandInteraction} interaction
	 */
	async execute(interaction, client, language) {
		const { options, guild, user } = interaction;

		const Data = await DontAt.findOne({ Guild: guild.id, User: user.id });
		if (!Data) {
			const nickname = user.nickname ? user.nickname : user.username;
			await DontAt.create({
				Guild: guild.id,
				User: user.id,
				Nickname: nickname,
			});
			const name = `Don't @ | ${nickname}`;
			await interaction.member.setNickname(name).catch((err) => {
				return;
			});
			const embed = new EmbedBuilder().setDescription(`${client.i18n.get(language, "utilities", "dont_at_enabled")}`).setColor("Green");
			const m = await interaction.reply({ embeds: [embed], ephemeral: true });
			setTimeout(() => {
				m.delete();
			}, 4000);
		} else if (Data) {
			const nick = Data.Nickname;

			await interaction.member.setNickname(nick).catch((err) => {
				return;
			});
			await DontAt.deleteMany({ Guild: guild.id, User: user.id });
			const embed = new EmbedBuilder().setDescription(`${client.i18n.get(language, "utilities", "dont_at_disabled")}`).setColor("Yellow");

			const m = await interaction.reply({ embeds: [embed], ephemeral: true });
			setTimeout(() => {
				m.delete();
			}, 4000);
		}
	},
};
