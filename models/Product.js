const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    _id: String,
    username: String,
    shop_id: String,

    title: String,
    category: String,
    subcategory: String,

    short_description: String,
    long_description: String,
    details: String,
    video_link: String,

    price: String,
    price_value: String,

    discount_percentage: Number,
    attain_options: [String],

    free_shipping: Boolean,
    shipping_cost: String,
    shipping_cost_value: String,


    available_quantity: Number,
    sold_quantity: Number,

    brand: String,
    images: [String],
    colors: [String],

    lock: Number,
    tags: [String],


    featured: Boolean,
    feature_expiry: Date,
    status: String,
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
productSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Product", productSchema)

