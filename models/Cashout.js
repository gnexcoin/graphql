const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cashoutSchema = new Schema({
    _id: String,
    username: String,
    method: String,
    account: String,
    amount: String,
    status: String,
    error: String,
    processed: {type: Date},
    timestamp: {type: Date, default: Date.now },
});

module.exports = mongoose.model("Cashout", cashoutSchema)