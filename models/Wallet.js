const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const walletSchema = new Schema({
    _id: String,
    username: String,
    method: String,
    address: String,
    verified: Boolean,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
walletSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Wallet", walletSchema)