const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const membershipSchema = new Schema({
    username: { type: String, required: true, unique: true },
    membership: String,
    max_invites: Number,
    max_withdrawal: Number,
    max_commission: Number,
    created_at: Date,
    updated_at: Date
});

module.exports = mongoose.model("Membership", membershipSchema)