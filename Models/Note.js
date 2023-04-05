const { model, Schema } = require("mongoose");

let Note = new Schema({
	Guild: String,
	MessageID: String,
	Details: Array,
});

module.exports = model("Note", Note);
