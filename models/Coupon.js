const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    coupon_id: String,
    value: Number
});

module.exports = mongoose.model("Coupon", couponSchema)