const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    inviter: String,
    invitee: String,
    creation_time: Date
});

userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("User", userSchema)

