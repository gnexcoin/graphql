const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const badModel = new Schema({
    username:        {type: String, required: true}
});

badModel.plugin(mongoosePaginate);
module.exports = mongoose.model("BadUser", badModel)