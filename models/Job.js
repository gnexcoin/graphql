const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
    _id: String,
    username: String,
    job_title: String,
    job_instructions: String,
    job_discussion_url: String,
    job_time_required: Number,
    lock: Number,
    tags: [String],
    category: String,
    pay_per_job: String,
    pay_per_job_value: Number,

    responses_required: Number,
    total_budget: String,
    total_budget_value: Number,
    featured: Boolean,
    feature_expiration: Date,
    status: String,
    cancel_before: {type: Date, default: Date.now },
    created_at: {type: Date, default: Date.now },
    updated_at: {type: Date, default: Date.now },
    error: String,
});
jobSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Job", jobSchema)

