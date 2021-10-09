const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    username:        {type: String, required: true, unique: true },
    full_name:       {type: String},
    about:           {type: String},
    website:         {type: String},
    profile_picture: {type: String},
    cover_photo:     {type: String},
    location:        {type: String},
    created_at:      {type: Date, default: new Date()},
    updated_at:      {type: Date, default: new Date()}
});

module.exports = mongoose.model("UserProfile", profileSchema)