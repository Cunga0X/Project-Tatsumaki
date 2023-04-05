const { Client, EmbedBuilder } = require("discord.js");
const DontAt = require("../../Models/DontAt");

module.exports = {
	name: "messageCreate",

	/**
	 *  @param {Message} message
	 *  @param {Client} client
	 *  @param {ChatInputCommandInteraction} interaction
	 */
	async execute(message, client, language) {
		const { author, guild } = message;
		const members = message.mentions.users.first();
		if (message.author.bot) return;
		if (!members) return;
		const Data = await DontAt.findOne({ Guild: message.guild.id, User: members.id });
		if (!Data) return;

		const member = message.guild.members.cache.get(members.id);

		if (message.content.includes(members)) {
			const embed = new EmbedBuilder()
				.setDescription(
					`${client.i18n.get(language, "interaction", "dont_at_message", {
						user: member.user.name,
					})}`,
				)
				.setColor("Yellow");
			const m = await message.reply({ embeds: [embed] });
			setTimeout(() => {
				m.delete();
				message.delete();
			}, 4000);
		}
	},
};
