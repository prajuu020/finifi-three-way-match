const mongoose = require("mongoose");

const goodsReceiptSchema = new mongoose.Schema({
    grnNumber: {
        type: String,
        required: true,
        unique: true
    },

    poNumber: {
        type: String,
        required: true
    },

    grnDate: {
        type: String,
        required: true
    },

    items: [
        {
            itemCode: String,
            description: String,
            receivedQuantity: Number
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model("GoodsReceipt", goodsReceiptSchema);