const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const commModel = new Schema({
    from:        {type: String, required: true},
    to:          {type: String, required: true},
    commission:  {type: Number, required: true},
    created_at:  {type: Date, default: new Date(), required: true}
});

commModel.plugin(mongoosePaginate);
module.exports = mongoose.model("Commission", commModel)