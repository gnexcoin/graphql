const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const cashrequestSchema = new Schema({
    _id: String,
    username: String,
    type: String,
    method: String,
    amount: Number,
    amount_value: String,
    price: Number,
    status: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
cashrequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("CashRequest", cashrequestSchema)