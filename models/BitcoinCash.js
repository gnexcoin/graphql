const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const bitcoincashSchema = new Schema({
    _id: String,
    userid: Number,
    address: String,
});
bitcoincashSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("BitcoinCash", bitcoincashSchema)