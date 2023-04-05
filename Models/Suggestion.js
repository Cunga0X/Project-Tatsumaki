const { model, Schema } = require("mongoose");

let Suggestion = new Schema({
	Guild: String,
	MessageID: String,
	Details: Array,
});

module.exports = model("Suggestion", Suggestion);
