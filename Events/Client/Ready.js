const { Client } = require("discord.js");
const ms = require("ms");
const mongoose = require("mongoose");
const { MONGO_DB } = require("../../config.js");
const chalk = require("chalk");
const express = require("express");

module.exports = {
	name: "ready",

	/**
	 * @param {Client} client
	 */
	async execute(client) {
		const { user, ws } = client;

		client.player.init(user.id);

		setInterval(() => {
			const ping = ws.ping;

			user.setActivity({
				name: `with Slime`,
				type: 0,
			});
		}, ms("5s"));

		const app = express();
		const port = 25200;

		app.use(express.json());

		app.get("/", (req, res) =>
			res.send(`
    	<html>
        	<head>
				<title>Success!</title>
			</head>
        	<body style="text-align: center;">
        		<h1>SloMc Bot</h1>
        	</body>
    	</html>
    	`),
		);

		app.use((error, req, res, next) => {
			res.status(500);
			res.send({ error: error });
			console.error(error.stack);
			next(error);
		});

		app.listen(port, () => console.log(chalk.green("Connected to API")));

		if (!MONGO_DB) return;

		mongoose.set("strictQuery", false);
		mongoose
			.connect(MONGO_DB, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(() => {
				console.log(chalk.green("Connected to MongoDB"));
				console.log(chalk.green(`\n${user.tag} is now online!`));
			})
			.catch((err) => {
				console.error(chalk.red(`Failed to connect to MongoDB: ${err}`));
			});
	},
};
