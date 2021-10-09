const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    _id: String,
    from: String,
    to: String,
    product_id: String,
    rating:  {type: Number, min: 0, max: 5, default: 0},
    lock: {type: Number},
    review_message: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String
});
reviewSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Review", reviewSchema)