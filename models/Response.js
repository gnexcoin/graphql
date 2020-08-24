const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const responseSchema = new Schema({
    _id: String,
    username: String,
    job_id: String,
    response_body: String,
    status: String,
    lock: Number,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String
});
responseSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Response", responseSchema)

