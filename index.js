const { Client, Partials, Collection } = require("discord.js");
const ms = require("ms");
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");
const config = require("./config.js");
const { I18n } = require("locale-parser");

const { Channel, GuildMember, Message, Reaction, ThreadMember, User, GuildScheduledEvent } = Partials;
const nodes = require("./Systems/Nodes");
const { Manager } = require("erela.js");
const client = new Client({
	intents: 131071,
	partials: [Channel, GuildMember, Message, Reaction, ThreadMember, User, GuildScheduledEvent],
	allowedMentions: { parse: ["everyone", "users", "roles"] },
	rest: { timeout: ms("1m") },
});

client.commands = new Collection();

client.player = new Manager({
	nodes,
	send: (id, payload) => {
		let guild = client.guilds.cache.get(id);
		if (guild) guild.shard.send(payload);
	},
});

client.i18n = new I18n(config.LANGUAGE);

client.on("raw", (d) => client.player.updateVoiceState(d));

const Handlers = ["Events", "Errors", "Commands", "Player"];

Handlers.forEach((handler) => {
	require(`./Handlers/${handler}`)(client, PG, Ascii);
});

module.exports = client;

const os = require("os");
const DEV_TOKEN = config.DEV_TOKEN;
const PROD_TOKEN = config.PROD_TOKEN;
const HOST_IP = config.HOST_IP;

const interfaces = os.networkInterfaces();
let addresses = [];

for (let k in interfaces) {
	for (let k2 in interfaces[k]) {
		let address = interfaces[k][k2];
		if (address.family === "IPv4" && !address.internal) {
			addresses.push(address.address);
		}
	}
}
console.log(addresses);
let token = DEV_TOKEN;
if (addresses.includes(HOST_IP)) {
	token = PROD_TOKEN;
}

client.login(token);
