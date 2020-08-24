const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const costSchema = new Schema({
    _id: String,
    job_creation_cost: String,
    job_response_cost: String,
    job_feature_cost: String,
    shop_creation_cost: String,
    product_listing_cost: String,

    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});

module.exports = mongoose.model("Cost", costSchema)

