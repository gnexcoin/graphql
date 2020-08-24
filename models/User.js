const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    commission: Number,
    referral: String,
    temp: Boolean,
    creation_time: Date
});

module.exports = mongoose.model("User", userSchema)

