const { model, Schema } = require("mongoose");

let verifications = new Schema({
	Guild: String,
	Channel: String,
	MessageID: String,
	player: String,
	code: String,
	Setup: String,
});

module.exports = model("verifications", verifications);
