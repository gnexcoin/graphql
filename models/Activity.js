const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const activitySchema = new Schema({
    _id: String,
    order_id: String,
    message: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
activitySchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Activity", activitySchema)