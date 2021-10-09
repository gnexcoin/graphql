const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    _id: String,
    ticket_id: String,
    from: String,
    to: String,
    message: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String
});
messageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Message", messageSchema)

