const { model, Schema } = require("mongoose");

let Streamer = new Schema({
	Guild: String,
	ChannelID: String,
	MessageID: String,
	RequestID: String,
	Notify: String,
});

module.exports = model("Streamer", Streamer);
