const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const shopSchema = new Schema({
    _id: String,
    username: String,
    title: String,
    short_description: String,
    logo: String,
    cover_photo: String,
    tags: [String],
    category: String,
    status: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
shopSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Shop", shopSchema)

