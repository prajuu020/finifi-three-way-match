const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true,
        unique: true
    },

    vendorName: {
        type: String,
        required: true
    },

    poDate: {
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

module.exports = mongoose.model("PurchaseOrder", purchaseSchema);