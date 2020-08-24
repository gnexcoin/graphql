const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authSchema = new Schema({
    username: String,
    auth_token: String
});

module.exports = mongoose.model("Authorization", authSchema)