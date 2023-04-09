const { Client, CommandInteraction, InteractionType, EmbedBuilder, ModalBuilder, ActionRowBuilder, StringSelectMenuBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, TextInputStyle } = require("discord.js");
const { ApplicationCommand } = InteractionType;
const Reply = require("../../Systems/Reply");
const GLang = require("../../Models/Language.js");
const Note = require("../../Models/Note");
const Staff = require("../../Models/Staff");
const Suggestion = require("../../Models/Suggestion");
const verifications = require("../../Models/Verification");
const Vprasalnik = require("../../Models/Vprasalnik");
const Ticket = require("../../Models/Ticket");
const Streamer = require("../../Models/Streamer");
const config = require("../../config");

module.exports = {
	name: "interactionCreate",

	/**
	 * @param {CommandInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const { user, guild, commandName, member, type, customId, fields, message, guildId, channel } = interaction;
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
		if (interaction.isButton()) {
			if (customId == "streamer-accept" || customId == "streamer-deny") {
				switch (customId) {
					case "streamer-accept":
						Streamer.findOne({ Guild: guild.id, RequestID: message.id }, async (err, data) => {
							if (err) {
								throw err;
							}
							if (!data) {
								console.log("err no data for streamer");
								const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "streams", "streamer_request_error")}`);
								const msg = await interaction.reply({ embeds: [embed], ephemeral: true });
								setTimeout(() => {
									msg.delete();
								}, 4000);
							}
							if (data) {
								try {
									const user = guild.members.cache.get(data.User);
									const channelNotification = client.channels.cache.get(config.STREAMER_WELCOME);
									const streamerRole = config.STREAMER;
									await guild.roles.fetch();
									user.roles.add(streamerRole);
									const embed = new EmbedBuilder().setColor("Green").setDescription(`${client.i18n.get(language, "streams", "streamer_accepted_msg")}`);
									await channelNotification.send({ content: `${user}`, embeds: [embed] });
									const embeda = new EmbedBuilder().setColor("Green").setDescription(
										`${client.i18n.get(language, "streams", "streamer_accepted_reply", {
											name: user.name,
										})}`,
									);
									const m = await interaction.reply({ embeds: [embeda], ephemeral: true });
									setTimeout(() => {
										m.delete();
									}, 4000);
								} catch (err) {
									console.log(err);
									const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "streams", "streamer_request_error")}`);
									const msg = await interaction.reply({ embeds: [embed], ephemeral: true });
									setTimeout(() => {
										msg.delete();
									}, 4000);
								} finally {
									return;
								}
							}
						});
						break;
					case "streamer-deny":
						break;
				}
			}
			if (customId == "streamer-req") {
				const modalStreamer = new ModalBuilder().setCustomId("streamer-modal").setTitle(`${client.i18n.get(language, "streams", "modal_title")}`);
				const name = new TextInputBuilder()
					.setCustomId("streamer-name")
					.setRequired(true)
					.setStyle(TextInputStyle.Short)
					.setMaxLength(20)
					.setLabel(`${client.i18n.get(language, "streams", "name_label")}`);
				const kanal = new TextInputBuilder()
					.setCustomId("streamer-kanal")
					.setRequired(true)
					.setStyle(TextInputStyle.Short)
					.setLabel(`${client.i18n.get(language, "streams", "channel_label")}`);
				const fstfield = new ActionRowBuilder().addComponents(name);
				const secfield = new ActionRowBuilder().addComponents(kanal);
				modalStreamer.addComponents(fstfield, secfield);
				await interaction.showModal(modalStreamer);
			}
			if (customId == "verify") {
				const modalVerify = new ModalBuilder().setCustomId("verify-modal").setTitle(`${client.i18n.get(language, "utilities", "verify_modal_title")}`);

				const code = new TextInputBuilder()
					.setCustomId("code")
					.setLabel(`${client.i18n.get(language, "utilities", "verify_modal_label")}`)
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
					.setMaxLength(10);

				const modalCode = new ActionRowBuilder().addComponents(code);

				modalVerify.addComponents(modalCode);
				await interaction.showModal(modalVerify);
			}
			if (customId == "vprasalnik") {
				const modalVprasalnik = new ModalBuilder().setCustomId("vprasalnik").setTitle(`${client.i18n.get(language, "utilities", "questionnaire_modal_title")}`);

				const vprasanje = new TextInputBuilder()
					.setCustomId("vprasanje")
					.setLabel(`${client.i18n.get(language, "utilities", "questionnaire_modal_label")}`)
					.setStyle(TextInputStyle.Paragraph)
					.setRequired(true)
					.setMaxLength(4000);

				const inputs = new ActionRowBuilder().addComponents(vprasanje);
				modalVprasalnik.addComponents(inputs);
				await interaction.showModal(modalVprasalnik);
			}
			if (customId == "support-ticket-enable" || customId == "ticket-disable") {
				Ticket.findOne({ Guild: guild.id, Message: message.id, Channel: channel.id, Ticket: "support-ticket-message" }, async (err, data) => {
					switch (customId) {
						case "support-ticket-enable":
							await Ticket.findOne({ Guild: guild.id, Ticket: "support-ticket-message" }, async (err, data) => {
								if (!data) return Reply(interaction, "Red", "❌", "No Ticket system found", true);
								const channelid = data.ChannelID;
								const messageid = data.MessageID;
								try {
									const channel = client.channels.cache.get(channelid);
									const message = await channel.messages.fetch(messageid);
									const embedOn = new EmbedBuilder()
										.setColor("Green")
										.setTitle(`${client.i18n.get(language, "tickets", "support_ticket_title")}`)
										.setDescription(`${client.i18n.get(language, "tickets", "support_ticket_message")}`)
										.setFooter({ text: `Staff ${interaction.guild.name}` });
									const menu = new ActionRowBuilder().addComponents(
										new StringSelectMenuBuilder()
											.setCustomId("select")
											.setMaxValues(1)
											.setPlaceholder(`${client.i18n.get(language, "tickets", "support_ticket_placeholder")}`)
											.addOptions(
												{
													label: `${client.i18n.get(language, "tickets", "question_label")}`,
													value: `question`,
												},
												{
													label: `${client.i18n.get(language, "tickets", "user_label")}`,
													value: `player`,
												},
												{
													label: `${client.i18n.get(language, "tickets", "donation_label")}`,
													value: `donation`,
												},
											),
									);
									await message.edit({ embeds: [embedOn], components: [menu] });
									const embed = new EmbedBuilder().setColor("Green").setDescription(`${client.i18n.get(language, "tickets", "support_manager_on")}`);
									const m = await interaction.reply({ embeds: [embed], ephemeral: true });
									setTimeout(() => {
										m.delete();
									}, 4000);
								} catch (error) {
									console.error(error);
								}
							});

							break;
						case "ticket-disable":
							await Ticket.findOne({ Guild: guild.id, Ticket: "support-ticket-message" }, async (err, data) => {
								if (!data) return Reply(interaction, "Red", "❌", "No Ticket system found", true);
								const messageid = data.MessageID;
								const channelid = data.ChannelID;

								try {
									const channel = client.channels.cache.get(channelid);
									const message = await channel.messages.fetch(messageid);
									const embed = message.embeds[0];
									if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);
									const embedOff = new EmbedBuilder().setTitle("Potrebuješ pomoč?").setDescription("Prijave so trenutno zaprte!").setColor("Red");

									await message.edit({ embeds: [embedOff], components: [] });
									Reply(interaction, "Green", "✅", "Prijave so zaprte", true);
								} catch (error) {
									console.error(error);
								}
							});
							break;
					}
				});
			}
			if (customId == "builder-sprejmi" || customId == "builder-zavrni") {
				switch (customId) {
					case "builder-sprejmi":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `trial-builder-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder().setTitle(`Pozdravljen ${username}`).setColor("Green").setDescription("Kontaktirali smo te glede tvoje Builder prijave in sicer potrebovali bi nekaj slik tvojih kreacij.");
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Builder ${username} sprejet.`);
						});

						break;
					case "builder-zavrni":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `zavrnjen-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder().setTitle(`Pozdravljen ${username}`).setColor("Red").setDescription("Kontaktirali smo te glede tvoje Builder prijave in smo se odločili, da tvojo prijavo zavrnemo. Lep pozdrav, osebje SloMc");
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Builder ${username} zavrnjen.`);
						});
						break;
				}
			}
			if (customId == "helper-sprejmi" || customId == "helper-zavrni") {
				switch (customId) {
					case "helper-sprejmi":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `trial-helper-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder()
								.setTitle(`Pozdravljen ${username}`)
								.setColor("Green")
								.setDescription(
									"Kontaktirali smo te glede tvoje Helper prijave in smo se odločili, da te sprejmemo kot Trail-Helperja. Več stvari ti bomo objasnili v klicu. Prosim, da nam sporčiš kdaj imaš čas, da se pogovorimo. Dobrodošel v ekipo",
								);
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Helper ${username} sprejet.`);
						});

						break;
					case "helper-zavrni":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `zavrnjen-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder().setTitle(`Pozdravljen ${username}`).setColor("Red").setDescription("Kontaktirali smo te glede tvoje Helper prijave in smo se odločili, da tvojo prijavo zavrnemo. Lep pozdrav, osebje SloMc");
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Helper ${username} zavrnjen.`);
						});
						break;
				}
			}
			if (customId == "dev-sprejmi" || customId == "dev-zavrni") {
				switch (customId) {
					case "dev-sprejmi":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `trial-dev-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder()
								.setTitle(`Pozdravljen ${username}`)
								.setColor("Green")
								.setDescription("Kontaktirali smo te glede tvoje Developer prijave in smo se odločili, da ti bomo pripravili manjšo nalogo. Kmalu te kontaktiramo in ti jo predstavimo. Lep Pozdrav, Osebje SloMc");
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Developer ${username} sprejet.`);
						});

						break;
					case "dev-zavrni":
						await Staff.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
							if (!data) return Reply(interaction, "Red", "❌", "No Ticket found", true);
							const messageid = data.MessageID;
							const userid = data.UserID;
							const username = data.Username;
							let channel = await interaction.guild.channels.create({
								name: `zavrnjen-${username}`,
								type: ChannelType.GuildText,
								parent: "1089220607096410223",
								permissionOverwrites: [
									{
										id: interaction.guild.id,
										deny: [PermissionsBitField.Flags.ViewChannel],
									},
									{
										id: userid,
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
									{
										id: "1081548619875880991",
										allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
									},
								],
							});
							const embed = new EmbedBuilder().setTitle(`Pozdravljen ${username}`).setColor("Red").setDescription("Kontaktirali smo te glede tvoje Developer prijave in smo se odločili, da tvojo prijavo zavrnemo. Lep pozdrav, osebje SloMc");
							const msg = await channel.send({ content: `<@${userid}>`, embeds: [embed], components: [] });
							Staff.findOneAndUpdate({ Guild: guildId, Message: messageid }, { TicketID: channel.id, TicketMessageID: msg.id });
							Reply(interaction, "Green", "✅", `Trial-Developer ${username} zavrnjen.`);
						});
						break;
				}
			}
			if (customId == "verify") {
				await verifications.findOne({ Guild: guildId, MessageID: message.id, Setup: "first" }, async (err, data) => {
					if (!data) return Reply(interaction, "Red", "❌", "No Verification message found", true);
				});
			}
			if (customId == "vprasalnik") {
				await Vprasalnik.findOne({ Guild: guild.id, MessageID: message.id }, async (err, data) => {
					if (!data) return Reply(interaction, "Red", "❌", "Vprašalnik ni najden!", true);
				});
			}
			if (customId == "suggest-accept" || customId == "suggest-decline") {
				if (!member.permissions.has(PermissionFlagsBits.Administrator)) return Reply(interaction, "Red", "❌", "Nimaš dovoljenja!", true);

				Suggestion.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
					if (err) throw err;

					if (!data) return Reply(interaction, "Red", "❌", "Napaka ni podatkov!", true);

					const embed = message.embeds[0];

					if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);

					switch (customId) {
						case "suggest-accept":
							embed.data.fields[2] = { name: "Status", value: "Sprejet", inline: true };
							const acceptedEmbed = EmbedBuilder.from(embed).setColor("Green");

							message.edit({ embeds: [acceptedEmbed], components: [] });
							Reply(interaction, "Green", "✅", "Predlog sprejet.", true);
							break;
						case "suggest-decline":
							embed.data.fields[2] = { name: "Status", value: "Zavrnjen", inline: true };
							const declinedEmbed = EmbedBuilder.from(embed).setColor("Red");

							message.edit({ embeds: [declinedEmbed], components: [] });
							Reply(interaction, "Green", "✅", "Predlog Zavrnjen.", true);
							break;
					}
				});
			}
			if (customId == "note-accept" || customId == "note-decline") {
				if (!member.permissions.has(PermissionFlagsBits.Administrator)) return Reply(interaction, "Red", "❌", "Nimaš dovoljenja!", true);

				Note.findOne({ Guild: guildId, MessageID: message.id }, async (err, data) => {
					if (err) throw err;

					if (!data) return Reply(interaction, "Red", "❌", "Napaka ni podatkov!", true);

					const embed = message.embeds[0];

					if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);

					switch (customId) {
						case "note-accept":
							embed.data.fields[1] = { name: "Status", value: "✅ Končano", inline: true };
							const acceptedEmbed = EmbedBuilder.from(embed).setColor("Green");

							message.edit({ embeds: [acceptedEmbed], components: [] });
							Reply(interaction, "Green", "✅", "Končano.", true);
							break;
						case "note-decline":
							embed.data.fields[1] = { name: "Status", value: "❌ Zavrženo", inline: true };
							const declinedEmbed = EmbedBuilder.from(embed).setColor("Red");

							message.edit({ embeds: [declinedEmbed], components: [] });
							Reply(interaction, "Green", "✅", "Zavrženo.", true);
							break;
					}
				});
			}
		}
		//! String Menu Interactions
		if (interaction.isStringSelectMenu) {
			if (customId == "select") {
				let selected = interaction.values[0];
				switch (selected) {
					case "question":
						if (!interaction.isStringSelectMenu()) return;
						const modalQuestion = new ModalBuilder().setCustomId("TicketQuestionModal").setTitle("Prosimo, da nam posredujete več informacij");

						const question = new TextInputBuilder().setCustomId("question").setLabel("Kako vam lahko pomagamo?").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Vaše vprašanje");

						const firstActionRowQ = new ActionRowBuilder().addComponents(question);

						modalQuestion.addComponents(firstActionRowQ);
						await interaction.showModal(modalQuestion);
						Ticket.findOne(
							{ Guild: guildId, MessageID: message.id, Ticket: "first" },
							async (err, data) => {
								setTimeout(() => {
									message.edit({ content: null });
								});
							},
							1000,
						);

						break;
					case "player":
						if (interaction.isButton()) return;
						if (interaction.isChatInputCommand()) return;

						const modalPlayer = new ModalBuilder().setCustomId("TicketPlayerModal").setTitle("Prosimo, da nam posredujete več informacij");

						const ticketMCnamePlayer = new TextInputBuilder().setCustomId("ticketMCname").setLabel("Vaše Minecraft uporabniško ime").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Jože");

						const reportedPlayer = new TextInputBuilder().setCustomId("reportedPlayer").setLabel("Igralec, ki ga prijavljate").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Miha");

						const ticketPlayerDescriptionInput = new TextInputBuilder().setCustomId("ticketPlayerDescriptionInput").setLabel("Opišite situacijo").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Miha uporablja hacked-client.");

						const firstActionRow = new ActionRowBuilder().addComponents(ticketMCnamePlayer);
						const secondActionRow = new ActionRowBuilder().addComponents(reportedPlayer);
						const thirdAcrtionRow = new ActionRowBuilder().addComponents(ticketPlayerDescriptionInput);

						modalPlayer.addComponents(firstActionRow, secondActionRow, thirdAcrtionRow);

						await interaction.showModal(modalPlayer);
						Ticket.findOne({ Guild: guildId, MessageID: message.id, Ticket: "first" }, async (err, data) => {
							message.edit({ content: null });
						});
						break;
					case "donation":
						if (interaction.isButton()) return;
						if (interaction.isChatInputCommand()) return;

						const modalDonation = new ModalBuilder().setCustomId("TicketDonacijaModal").setTitle("Prosimo, da nam posredujete več informacij");

						const ticketMCnameDonacija = new TextInputBuilder().setCustomId("ticketMCnameDonacija").setLabel("Vaše Minecraft uporabniško ime").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Jože");

						const tos = new TextInputBuilder().setCustomId("tos").setLabel("Ali se strinjate z Terms of Use").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Da/Ne");

						const shopItems = new TextInputBuilder().setCustomId("shopItems").setLabel("Katere Izdelke želite pridobiti?").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Rank VIP");

						const psc = new TextInputBuilder().setCustomId("psc").setLabel("PaySafeCard Koda").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("0123-4567-8910-1112");

						const firstActionRowD = new ActionRowBuilder().addComponents(ticketMCnameDonacija);
						const secondActionRowD = new ActionRowBuilder().addComponents(tos);
						const thirdActionRow = new ActionRowBuilder().addComponents(shopItems);
						const fourthActionRow = new ActionRowBuilder().addComponents(psc);

						modalDonation.addComponents(firstActionRowD, secondActionRowD, thirdActionRow, fourthActionRow);

						await interaction.showModal(modalDonation);
						Ticket.findOne({ Guild: guildId, MessageID: message.id, Ticket: "first" }, async (err, data) => {
							message.edit({ content: null });
						});
						break;
				}
			}
			if (customId == "timeQ") {
				Ticket.findOne({ Guild: guildId, MessageID: message.id, Channel: channel.id }, async (err, data) => {
					if (err) throw err;
					if (!data) return Reply(interaction, "Red", "❌", "Napaka ni podatkov!", true);

					const embed = message.embeds[0];

					if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);
					let selected = interaction.values[0];
					switch (selected) {
						case "1m":
							await interaction.deferReply();
							const dmEmbedQ1 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 1 min`)
								.setDescription("Hvala, ker ste nas kontaktirali! Če imate še kakšno vprašanje, lahko ustvarite nov ticket.")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ1] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
									Ticket.deleteOne({ Channel: channel.id });
								}, ms("1m"));
							break;
						case "3h":
							await interaction.deferReply();
							const dmEmbedQ3 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 3 ure`)
								.setDescription("Hvala, ker ste nas kontaktirali! Če imate še kakšno vprašanje, lahko ustvarite nov ticket.")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ3] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("3h"));
							break;
						case "24h":
							await interaction.deferReply();
							const dmEmbedQ24 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 24 ur`)
								.setDescription("Hvala, ker ste nas kontaktirali! Če imate še kakšno vprašanje, lahko ustvarite nov ticket.")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ24] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("24h"));
							break;
					}
				});
			}
			if (customId == "timeP") {
				Ticket.findOne({ Guild: guildId, MessageID: message.id, Channel: channel.id }, async (err, data) => {
					if (err) throw err;
					if (!data) return Reply(interaction, "Red", "❌", "Napaka ni podatkov!", true);

					const embed = message.embeds[0];

					if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);
					let selected = interaction.values[0];
					switch (selected) {
						case "1m":
							await interaction.deferReply();
							const dmEmbedQ1 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 1 min`)
								.setDescription("Hvala za prijavo! Če potrebujete še kaj, lahko ustvarite nov ticket")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ1] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("1m"));
							break;
						case "3h":
							await interaction.deferReply();
							const dmEmbedQ3 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 3 ure`)
								.setDescription("Hvala za prijavo! Če potrebujete še kaj, lahko ustvarite nov ticket")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ3] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("3h"));
							break;
						case "24h":
							await interaction.deferReply();
							const dmEmbedQ24 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 24 ur`)
								.setDescription("Hvala za prijavo! Če potrebujete še kaj, lahko ustvarite nov ticket")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ24] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("24h"));
							break;
					}
				});
			}
			if (customId == "timeD") {
				Ticket.findOne({ Guild: guildId, MessageID: message.id, Channel: channel.id }, async (err, data) => {
					if (err) throw err;
					if (!data) return Reply(interaction, "Red", "❌", "Napaka ni podatkov!", true);

					const embed = message.embeds[0];

					if (!embed) return Reply(interaction, "Red", "❌", "No embed was found!", true);
					let selected = interaction.values[0];
					switch (selected) {
						case "1m":
							await interaction.deferReply();
							const dmEmbedQ1 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 1 min`)
								.setDescription("Hvala za vašo donacijo in Hvala ker nas podpirate. 💖")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ1] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("1m"));
							break;
						case "3h":
							await interaction.deferReply();
							const dmEmbedQ3 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 3 ure`)
								.setDescription("Hvala za vašo donacijo in Hvala ker nas podpirate. 💖")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ3] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("3h"));
							break;
						case "24h":
							await interaction.deferReply();
							const dmEmbedQ24 = new EmbedBuilder()
								.setColor("Yellow")
								.setTitle(`Tvoja prijava bo zaprta čez 24 ur`)
								.setDescription("Hvala za vašo donacijo in Hvala ker nas podpirate. 💖")
								.setFooter({ text: `Osebje ${interaction.guild.name}` })
								.setTimestamp();

							await interaction.editReply({ embeds: [dmEmbedQ24] }).catch((err) => {
								return;
							});

							if (interaction)
								setTimeout(() => {
									channel.delete();
								}, ms("24h"));
							break;
					}
				});
			}
			if (customId == "select-staff") {
				let selected = interaction.values[0];
				switch (selected) {
					case "helper":
						if (interaction.isButton()) return;
						if (interaction.isChatInputCommand()) return;

						const modalHelper = new ModalBuilder().setCustomId("helper").setTitle("Prosimo, da nam posredujete več informacij");

						const nameMChelper = new TextInputBuilder().setCustomId("nameMChelper").setLabel("Vaše Minecraft ime").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Jože").setMaxLength(400);

						const izkusnjeHelper = new TextInputBuilder().setCustomId("izkusnjeHelper").setLabel("Vaše dosedanje izkušnje").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(4000);

						const zakajHelper = new TextInputBuilder().setCustomId("zakajHelper").setLabel("Zakaj bi izbrali ravno tebe?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(1024);

						const firstActionRowH = new ActionRowBuilder().addComponents(nameMChelper);
						const secondActionRowH = new ActionRowBuilder().addComponents(izkusnjeHelper);
						const thirdActionRowH = new ActionRowBuilder().addComponents(zakajHelper);

						modalHelper.addComponents(firstActionRowH, secondActionRowH, thirdActionRowH);

						await interaction.showModal(modalHelper);
						Ticket.findOne({ Guild: guildId, MessageID: message.id, Ticket: "staff-first" }, async (err, data) => {
							message.edit({ content: null });
						});
						break;
					case "builder":
						if (interaction.isButton()) return;
						if (interaction.isChatInputCommand()) return;

						const modalBuilder = new ModalBuilder().setCustomId("builder").setTitle("Prosimo, da nam posredujete več informacij");

						const nameMCbuilder = new TextInputBuilder().setCustomId("nameMCbuilder").setLabel("Vaše Minecraft ime").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Jože").setMaxLength(400);

						const izkusnjeBuilder = new TextInputBuilder().setCustomId("izkusnjeBuilder").setLabel("Vaše dosedanje izkušnje").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(4000);

						const zakajBuilder = new TextInputBuilder().setCustomId("zakajBuilder").setLabel("Zakaj bi izbrali ravno tebe?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(1024);

						const stilBuilder = new TextInputBuilder().setCustomId("stilBuilder").setLabel("Vaš stil grajenja").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Mesta, Spawni, itd.").setMaxLength(400);

						const firstActionRowB = new ActionRowBuilder().addComponents(nameMCbuilder);
						const secondActionRowB = new ActionRowBuilder().addComponents(izkusnjeBuilder);
						const thirdActionRowB = new ActionRowBuilder().addComponents(zakajBuilder);
						const fourthActionRowB = new ActionRowBuilder().addComponents(stilBuilder);

						modalBuilder.addComponents(firstActionRowB, secondActionRowB, thirdActionRowB, fourthActionRowB);

						await interaction.showModal(modalBuilder);
						Ticket.findOne({ Guild: guildId, MessageID: message.id, Ticket: "staff-first" }, async (err, data) => {
							message.edit({ content: null });
						});
						break;

					case "developer":
						if (interaction.isButton()) return;
						if (interaction.isChatInputCommand()) return;

						const modalDeveloper = new ModalBuilder().setCustomId("dev").setTitle("Prosimo, da nam posredujete več informacij");

						const izkusnjeDeveloper = new TextInputBuilder().setCustomId("izkusnjeDev").setLabel("Vaše dosedanje izkušnje").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(4000);

						const zakajDeveloper = new TextInputBuilder().setCustomId("zakajDev").setLabel("Zakaj bi izbrali ravno tebe?").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(30).setMaxLength(1024);

						const langDeveloper = new TextInputBuilder().setCustomId("langDev").setLabel("V katerih jezikih najpogosteje delate?").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Java, C#, C++, Js, itd.").setMaxLength(400);

						const portfolio = new TextInputBuilder().setCustomId("portDev").setLabel("Link do vašega porfolia").setStyle(TextInputStyle.Short).setPlaceholder("Github, Website, itd.").setMaxLength(400);

						const secondActionRowD = new ActionRowBuilder().addComponents(izkusnjeDeveloper);
						const thirdActionRowD = new ActionRowBuilder().addComponents(zakajDeveloper);
						const fourthActionRowD = new ActionRowBuilder().addComponents(langDeveloper);
						const fifthActionRowD = new ActionRowBuilder().addComponents(portfolio);

						modalDeveloper.addComponents(secondActionRowD, thirdActionRowD, fourthActionRowD, fifthActionRowD);

						await interaction.showModal(modalDeveloper);
						Ticket.findOne({ Guild: guildId, MessageID: message.id, Ticket: "staff-first" }, async (err, data) => {
							message.edit({ content: null });
						});

						break;
				}
			}
		}
		//! Modal Submit Interactions
		if (interaction.isModalSubmit) {
			switch (customId) {
				case "streamer-modal":
					Streamer.findOne({ Guild: guild.id, RequestID: "streamer-request" }, async (err, data) => {
						if (err) {
							throw err;
						}
						if (!data) {
							const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "streams", "modal_error")}`);
							const m = await interaction.reply({ embeds: [embed], ephemeral: true });
							setTimeout(() => {
								m.delete();
							}, 4000);
						}
						const notifyChannel = data.Notify;
						const name = fields.getTextInputValue("streamer-name");
						const kanal = fields.getTextInputValue("streamer-kanal");

						const buttons = new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId("streamer-accept")
								.setStyle(ButtonStyle.Success)
								.setLabel(`${client.i18n.get(language, "streams", "streamer_accept_button")}`),
							new ButtonBuilder()
								.setCustomId("streamer-deny")
								.setStyle(ButtonStyle.Danger)
								.setLabel(`${client.i18n.get(language, "streams", "streamer_deny_button")}`),
						);
						const embed = new EmbedBuilder()
							.setColor("LuminousVividPink")
							.setTitle(`${client.i18n.get(language, "streams", "streamer_request_title")}`)
							.addFields({ name: `Ime:`, value: `${name}` })
							.addFields({ name: `Kanal:`, value: `${kanal}` })
							.addFields({ name: `Discord:`, value: `${interaction.user.tag}` });
						try {
							const channel = client.channels.cache.get(notifyChannel);
							const m = await channel.send({ embeds: [embed], components: [buttons] });
							Streamer.create({ Guild: guild.id, Notify: channel.id, RequestID: m.id, User: interaction.user.id });
						} catch (err) {
							const embed = new EmbedBuilder().setColor("Yellow").setDescription(`${client.i18n.get(language, "streams", "streamer_request_error")}`);
							const m = await interaction.reply({ embeds: [embed], ephemeral: true });
							setTimeout(() => {
								m.delete();
							}, 4000);
							throw err;
						}
						const embeds = new EmbedBuilder().setColor("Green").setDescription(`${client.i18n.get(language, "streams", "streamer_request_success")}`);
						const ms = await interaction.reply({ embeds: [embeds], ephemeral: true });
						setTimeout(() => {
							ms.delete();
						}, 4000);
					});
					break;
				case "TicketQuestionModal":
					const question = fields.getTextInputValue("question");

					const ticketUserQ = `vprašanje-${interaction.user.username}`;
					const channelsQ = await guild.channels.fetch();
					const posChannelQ = channelsQ.find((c) => c.name === ticketUserQ.toLowerCase());

					if (posChannelQ) return Reply(interaction, "Yellow", "⚠️", `Ticket že imaš odprt - ${posChannelQ}`, true);

					const embedQ = new EmbedBuilder()
						.setColor("Green")
						.setTitle(`${interaction.user.username}'s Ticket`)
						.setDescription(`Pozdravljen <@!${interaction.user.id}>! Prosim počakajte, da osebje pregleda vaše podatke`)
						.addFields({ name: `Vprašanje`, value: `${question}` })
						.addFields({ name: `Tip`, value: `Vprašanje` })
						.setFooter({ text: `${interaction.guild.name} Support` });

					const buttonQ = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket-close-question").setLabel("🗑️ Close Ticket").setStyle(ButtonStyle.Danger));

					const menuQ = new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder().setCustomId("timeQ").setMaxValues(1).setPlaceholder("Izberi čas zaprtja prijave").addOptions(
							{
								label: `🕐 1 Minuta`,
								value: `1m`,
							},
							{
								label: `🕒 3 Ure`,
								value: `3h`,
							},
							{
								label: `🕛 24 Ur`,
								value: `24h`,
							},
						),
					);

					let channelQ = await interaction.guild.channels.create({
						name: `vprašanje-${interaction.user.username}`,
						type: ChannelType.GuildText,
						parent: "1087386997003399178",
						permissionOverwrites: [
							{
								id: interaction.guild.id,
								deny: [PermissionsBitField.Flags.ViewChannel],
							},
							{
								id: interaction.user.id,
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
							},
							{
								id: "1081548619875880991",
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
							},
						],
					});
					const msgQ = await channelQ.send({ embeds: [embedQ], components: [menuQ] });

					await Ticket.create({
						Guild: guild.id,
						Channel: channelQ.id,
						MessageID: msgQ.id,
					});

					Reply(interaction, "Green", "✅", `Tvoj ticket je odprt - ${channelQ}`, true);

					break;
				case "TicketPlayerModal":
					const ticketMCname = fields.getTextInputValue("ticketMCname");
					const ticketDescriptionInput = fields.getTextInputValue("ticketPlayerDescriptionInput");
					const reportedPlayer = fields.getTextInputValue("reportedPlayer");

					const ticketUserP = `prijava-${interaction.user.username}`;
					const channelsP = await guild.channels.fetch();
					const posChannelP = channelsP.find((c) => c.name === ticketUserP.toLowerCase());
					if (posChannelP) return Reply(interaction, "Yellow", "⚠️", `Ticket že imaš odprt - ${posChannelP}`, true);

					const embedP = new EmbedBuilder()
						.setColor("Green")
						.setTitle(`${interaction.user.username}'s Ticket`)
						.setDescription(`Pozdravljen <@!${interaction.user.id}>! Prosim počakajte, da osebje pregleda vaše podatke`)
						.addFields({ name: `Ime v MC`, value: `${ticketMCname}` })
						.addFields({ name: `Igralec ki ga prijavlja`, value: `${reportedPlayer}` })
						.addFields({ name: `Opis`, value: `${ticketDescriptionInput}` })
						.addFields({ name: `Tip`, value: `Prijava igralca` })
						.setFooter({ text: `${interaction.guild.name} Support` });

					const buttonP = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket-close-player").setLabel("🗑️ Close Ticket").setStyle(ButtonStyle.Danger));
					const menuP = new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder().setCustomId("timeP").setMaxValues(1).setPlaceholder("Izberi čas zaprtja prijave").addOptions(
							{
								label: `🕐 1 Minuta`,
								value: `1m`,
							},
							{
								label: `🕒 3 Ure`,
								value: `3h`,
							},
							{
								label: `🕛 24 Ur`,
								value: `24h`,
							},
						),
					);

					let channelP = await interaction.guild.channels.create({
						name: `prijava-${interaction.user.username}`,
						type: ChannelType.GuildText,
						parent: "1087386997003399178",
						permissionOverwrites: [
							{
								id: interaction.guild.id,
								deny: [PermissionsBitField.Flags.ViewChannel],
							},
							{
								id: interaction.user.id,
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
							},
							{
								id: "1081548619875880991",
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
							},
						],
					});

					const msgP = await channelP.send({ embeds: [embedP], components: [menuP] });

					await Ticket.create({
						Guild: guild.id,
						Channel: channelP.id,
						MessageID: msgP.id,
					});

					Reply(interaction, "Green", "✅", `Tvoj ticket je odprt - ${channelP}`, true);

					break;
				case "TicketDonacijaModal":
					const ticketMCnameDonacija = fields.getTextInputValue("ticketMCnameDonacija");
					const tos = fields.getTextInputValue("tos");
					const shopItems = fields.getTextInputValue("shopItems");
					const psc = fields.getTextInputValue("psc");

					const ticketUserD = `donacija-${interaction.user.username}`;
					const channelsD = await guild.channels.fetch();
					const posChannelD = channelsD.find((c) => c.name === ticketUserD.toLowerCase());
					if (posChannelD) return Reply(interaction, "Yellow", "⚠️", `Ticket že imaš odprt - ${posChannelD}`, true);

					const embed = new EmbedBuilder()
						.setColor("Green")
						.setTitle(`${interaction.user.username}'s Ticket`)
						.setDescription(`Pozdravljen <@!${interaction.user.id}>! Prosim počakajte, da osebje pregleda vaše podatke`)
						.addFields({ name: `Minecraft ime`, value: `${ticketMCnameDonacija}` })
						.addFields({ name: `Terms of Service`, value: `${tos}` })
						.addFields({ name: `Shop Items`, value: `${shopItems}` })
						.addFields({ name: `PaySafeCard`, value: `${psc}` })
						.addFields({ name: `Tip`, value: `Donacija` })
						.setFooter({ text: `${interaction.guild.name} Support` });

					const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket-close-donation").setLabel("🗑️ Close Ticket").setStyle(ButtonStyle.Danger));
					const menuD = new ActionRowBuilder().addComponents(
						new StringSelectMenuBuilder().setCustomId("timeD").setMaxValues(1).setPlaceholder("Izberi čas zaprtja prijave").addOptions(
							{
								label: `🕐 1 Minuta`,
								value: `1m`,
							},
							{
								label: `🕒 3 Ure`,
								value: `3h`,
							},
							{
								label: `🕛 24 Ur`,
								value: `24h`,
							},
						),
					);

					let channel = await interaction.guild.channels.create({
						name: `donacija-${interaction.user.username}`,
						type: ChannelType.GuildText,
						parent: "1087386997003399178",
						permissionOverwrites: [
							{
								id: interaction.guild.id,
								deny: [PermissionsBitField.Flags.ViewChannel],
							},
							{
								id: interaction.user.id,
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ReadMessageHistory],
							},
						],
					});

					const msg = await channel.send({ embeds: [embed], components: [menuD] });

					await Ticket.create({
						Guild: guild.id,
						Channel: channel.id,
						MessageID: msg.id,
					});

					Reply(interaction, "Green", "✅", `Tvoj ticket je odprt - ${channel}`, true);

					break;
				case "helper":
					const nameMChelper = fields.getTextInputValue("nameMChelper");
					const izkusnjeHelper = fields.getTextInputValue("izkusnjeHelper");
					const zakajHelper = fields.getTextInputValue("zakajHelper");

					const embedH = new EmbedBuilder()
						.setAuthor({ name: `Nova Helper Prijava: ${interaction.user.tag}`, iconURL: "https://cdn.discordapp.com/attachments/1047634549644992624/1089644324435795988/sos.png" })
						.setThumbnail(`https://cdn.discordapp.com/attachments/1047634549644992624/1089456752430419968/slimey.png`)
						.setColor("Green")
						.setTitle("Izkušnje:")
						.setDescription(`${izkusnjeHelper}`)
						.addFields({ name: `Zakaj misli, da je primeren:`, value: `${zakajHelper}` })
						.addFields({ name: `Ime v Minecraftu:`, value: `${nameMChelper}` });

					const buttonsH = new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("helper-sprejmi").setLabel("Sprejmi Trial-Helper").setStyle(ButtonStyle.Success),
						new ButtonBuilder().setCustomId("helper-zavrni").setLabel("Zavrni").setStyle(ButtonStyle.Danger),
					);

					await Ticket.findOne({ Guild: guildId, Ticket: "staff-first" }, async (err, data) => {
						if (!data) return Reply(interaction, "Red", "❌", "No Staff system found", true);
						const channelid = data.Notify;

						try {
							const channel = client.channels.cache.get(channelid);

							const msgH = await channel.send({ embeds: [embedH], components: [buttonsH] });
							await Staff.create({
								Guild: guildId,
								ChannelID: channel,
								MessageID: msgH.id,
								TicketID: "None",
								TicketMessageID: "None",
								UserID: user.id,
								Username: user.username,
							});
							Reply(interaction, "Green", "✅", "Vaša prijava je oddana.", true);
						} catch (error) {
							console.error(error);
						}
					});
					break;
				case "builder":
					const nameMCbuilder = fields.getTextInputValue("nameMCbuilder");
					const izkusnjeBuilder = fields.getTextInputValue("izkusnjeBuilder");
					const zakajBuilder = fields.getTextInputValue("zakajBuilder");
					const stilBuilder = fields.getTextInputValue("stilBuilder");

					const embedB = new EmbedBuilder()
						.setAuthor({ name: `Nova Builder Prijava: ${interaction.user.tag}`, iconURL: "https://cdn.discordapp.com/attachments/1047634549644992624/1089645463596187749/builder.png" })
						.setThumbnail(`https://cdn.discordapp.com/attachments/1047634549644992624/1089456752430419968/slimey.png`)
						.setColor("Yellow")
						.setTitle(`Izkušnje:`)
						.setDescription(`${izkusnjeBuilder}`)
						.addFields({ name: `Zakaj misli, da je primeren`, value: `${zakajBuilder}` })
						.addFields({ name: `Stil`, value: `${stilBuilder}` })
						.addFields({ name: `Ime v MC`, value: `${nameMCbuilder}` });

					const buttonsB = new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("builder-sprejmi").setLabel("Sprejmi Trial-Builder").setStyle(ButtonStyle.Success),
						new ButtonBuilder().setCustomId("builder-zavrni").setLabel("Zavrni").setStyle(ButtonStyle.Danger),
					);

					await Ticket.findOne({ Guild: guildId, Ticket: "staff-first" }, async (err, data) => {
						if (!data) return Reply(interaction, "Red", "❌", "No Staff system found", true);
						const channelid = data.Notify;

						try {
							const channel = client.channels.cache.get(channelid);

							const msgB = await channel.send({ embeds: [embedB], components: [buttonsB] });
							await Staff.create({
								Guild: guildId,
								ChannelID: channel,
								MessageID: msgB.id,
								TicketID: "None",
								TicketMessageID: "None",
								UserID: user.id,
								Username: user.username,
							});
							Reply(interaction, "Green", "✅", "Vaša prijava je oddana.", true);
						} catch (error) {
							console.error(error);
						}
					});
					break;
				case "dev":
					const izkusnjeDeveloper = fields.getTextInputValue("izkusnjeDev");
					const zakajDeveloper = fields.getTextInputValue("zakajDev");
					const langDeveloper = fields.getTextInputValue("langDev");
					const portfolio = fields.getTextInputValue("portDev");

					const embedD = new EmbedBuilder()
						.setAuthor({ name: `Nova Developer Prijava: ${interaction.user.tag}`, iconURL: "https://cdn.discordapp.com/attachments/1047634549644992624/1089646057769668791/dev.png" })
						.setThumbnail(`https://cdn.discordapp.com/attachments/1047634549644992624/1089456752430419968/slimey.png`)
						.setColor("LuminousVividPink")
						.setTitle("Izkušnje:")
						.setDescription(`${izkusnjeDeveloper}`)
						.addFields({ name: `Zakaj misli, da je primeren`, value: `${zakajDeveloper}` })
						.addFields({ name: `Jeziki`, value: `${langDeveloper}` })
						.addFields({ name: `Portfolio`, value: `${portfolio}` });

					const buttonsD = new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("dev-sprejmi").setLabel("Sprejmi Trial-Dev").setStyle(ButtonStyle.Success),
						new ButtonBuilder().setCustomId("dev-zavrni").setLabel("Zavrni").setStyle(ButtonStyle.Danger),
					);

					await Ticket.findOne({ Guild: guildId, Ticket: "staff-first" }, async (err, data) => {
						if (!data) return Reply(interaction, "Red", "❌", "No Staff system found", true);
						const channelid = data.Notify;

						try {
							const channel = client.channels.cache.get(channelid);

							const msgD = await channel.send({ embeds: [embedD], components: [buttonsD] });
							await Staff.create({
								Guild: guildId,
								ChannelID: channel,
								MessageID: msgD.id,
								TicketID: "None",
								TicketMessageID: "None",
								UserID: user.id,
								Username: user.username,
							});
							Reply(interaction, "Green", "✅", "Vaša prijava je oddana.", true);
						} catch (error) {
							console.error(error);
						}
					});
					break;
				case "verify-modal":
					const receivedCode = fields.getTextInputValue("code");
					verifications.findOne({ code: receivedCode }, async (err, data) => {
						if (err) return console.error(err);
						if (!data) {
							return Reply(interaction, "Red", "❌", "Napačna koda!", true);
						}
						const playername = data.player;
						await member.setNickname(playername).catch((err) => {
							return console.error(err);
						});
						await message.guild.roles.fetch();
						let role = message.guild.roles.cache.get("1089932103405289554");
						member.roles.add(role);
						verifications.deleteMany({ player: playername });
						Reply(interaction, "Green", "✅", "Verified", true);
					});
					break;
				case "vprasalnik":
					const vprasanje = fields.getTextInputValue("vprasanje");
					Vprasalnik.findOne({ MessageID: message.id }, async (err, data) => {
						if (err) return console.error(err);
						if (!data) {
							return Reply(interaction, "Red", "❌", "Napaka!", true);
						}
						const channelid = data.Notify;

						const channel = client.channels.cache.get(channelid);
						const embed = new EmbedBuilder()
							.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
							.setTitle("Odgovor Vprašalnika")
							.setDescription(`${vprasanje}`)
							.setColor("Orange");
						channel.send({ embeds: [embed] });
						Reply(interaction, "Green", "✅", "Odgovor poslan, hvala za sodelovanje!", true);
					});
					break;
			}
		}
	},
};
