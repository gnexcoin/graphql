const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    _id: String,
    order_creator: String,
    order_receiver: String,
    purchased_item_id: String,
    full_name: String,
    phone: String,
    email: String,
    address1: String,
    address2: String,
    country: String,
    city: String,
    postal_code: String,
    status: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
orderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Order", orderSchema)