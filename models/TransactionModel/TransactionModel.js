const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;
const trxSchema = new Schema({
    username:   {type: String, required: true},
    method:     {type: String},
    deposo:     {type: String},
    amount:     {type: Number},
    status:     {type: String},
    type:       {type: String},
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date, default: new Date()},
});
trxSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Transaction", trxSchema)