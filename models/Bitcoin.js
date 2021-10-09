const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const bitcoinSchema = new Schema({
    _id: String,
    userid: Number,
    address: String,
});
bitcoinSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Bitcoin", bitcoinSchema)