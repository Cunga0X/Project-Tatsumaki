const { Client } = require("discord.js");
const chalk = require("chalk");

/**
 * @param {Client} client
 */
module.exports = async (client, PG, Ascii) => {
	const Table = new Ascii("Player Events Loaded");

	const EventFiles = await PG(`${process.cwd()}/PlayerEvents/*.js`);

	EventFiles.map(async (file) => {
		const event = require(file);

		client.player.on(event.name, (...args) => event.execute(...args, client));

		await Table.addRow(`${event.name}`, "🟩", "Successfull");
	});

	console.log(chalk.magenta(Table.toString()));
};
