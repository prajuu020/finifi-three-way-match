const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },

    poNumber: {
        type: String,
        required: true
    },

    invoiceDate: {
        type: String,
        required: true
    },

    items: [
        {
            itemCode: String,
            description: String,
            quantity: Number,
            unitPrice: Number
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model("Invoice", invoiceSchema);