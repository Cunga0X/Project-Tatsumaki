const { model, Schema } = require("mongoose");

let Ticket = new Schema({
	Guild: String,
	Channel: String,
	MessageID: String,
	Ticket: String,
	ChannelID: String,
	Notify: String,
});

module.exports = model("Ticket", Ticket);
