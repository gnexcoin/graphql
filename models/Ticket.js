const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    _id: String,
    username: String,
    title: String,
    message: String,
    closed: Boolean,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String
});
ticketSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Ticket", ticketSchema)

