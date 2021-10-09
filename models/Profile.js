const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    _id: String,
    username: String,
    full_name: String,
    phone: String,
    email: String,
    intro_video: String,
    address1: String,
    address2: String,
    country: String,
    city: String,
    postal_code: String,
    profile_image: String,
    cover_image: String,
    subscribers: [String],
    subscribees: [String],
    about: String,
    status: String,
    lock: {type: Number},
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String
});

module.exports = mongoose.model("Profile", profileSchema)

