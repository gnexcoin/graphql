const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const wishSchema = new Schema({
    _id: String,
    username: String,
    item_ids: [String],
    subtotal: Number,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
wishSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Wish", wishSchema)