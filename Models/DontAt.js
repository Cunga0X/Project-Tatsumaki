const { model, Schema } = require("mongoose");

let DontAt = new Schema({
	User: String,
	Guild: String,
	Nickname: String,
});

module.exports = model("DontAt", DontAt);
