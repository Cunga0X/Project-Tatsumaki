const { model, Schema } = require("mongoose");

let Vprasalnik = new Schema({
	Guild: String,
	Channel: String,
	MessageID: String,
	Notify: String,
	ID: String,
});

module.exports = model("Vprasalnik", Vprasalnik);
