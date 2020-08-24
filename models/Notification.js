const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    _id: String,
    to: String,
    order_id: String,
    message: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
notificationSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Notification", notificationSchema)