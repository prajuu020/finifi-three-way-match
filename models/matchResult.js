const mongoose = require("mongoose");

const matchResultSchema = new mongoose.Schema({

    poNumber: String,

    status: String,

    reason: String,

    invoiceNumber: String

}, {
    timestamps: true
});

module.exports = mongoose.model("MatchResult", matchResultSchema);