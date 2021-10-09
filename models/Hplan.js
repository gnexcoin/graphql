const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hplanSchema = new Schema({
    _id: String,
    username: String,
    planID: String,
    amount: Number,
    invested_amount: String,
    package_percent: String,
    claim_amount: String,
    claim: Number,
    package_period: Number,
    status: String,
    lock: Number,
    claim_date: {type: Date},
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now }
});

module.exports = mongoose.model("Hplan", hplanSchema)