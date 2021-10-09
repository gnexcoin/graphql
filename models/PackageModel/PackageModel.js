const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const packageSchema = new Schema({
    username:        {type: String, required: true},
    type:            {type: String, required: true},
    cost:            {type: String, required: true},
    created_at:      {type: Date, default: new Date(), required: true}
});
packageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Package", packageSchema)