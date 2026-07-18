const Purchase = require("../models/PurchaseOrder");
const GoodsReceipt = require("../models/GoodsReceipt");
const Invoice = require("../models/Invoice");
const stringSimilarity = require("string-similarity");

function normalize(text = "") {
    return text
        .toLowerCase()

        // Remove brands
        .replace(/meatigo rtc/g, "")
        .replace(/meatigo/g, "")
        .replace(/chef momos/g, "")
        .replace(/chef/g, "")
        .replace(/super saver/g, "")
        .replace(/everyday/g, "")
        .replace(/psm/g, "")

        // Standardize words
        .replace(/vegetable/g, "veg")
        .replace(/chiili/g, "chili")
        .replace(/pieces/g, "")
        .replace(/piece/g, "")
        .replace(/pcs/g, "")
        .replace(/frozen/g, "")
        .replace(/pack/g, "")

        // Remove brackets
        .replace(/\(.*?\)/g, "")

        // Remove quantity
        .replace(/[0-9.]+/g, " ")

        // Keep spaces
        .replace(/[^a-z ]/g, " ")

        // Remove extra spaces
        .replace(/\s+/g, " ")

        .trim();
}

exports.matchPO = async (poNumber) => {

    const po = await Purchase.findOne({ poNumber });

    if (!po) {
        return {
            status: "insufficient_documents",
            reason: "Purchase Order not found"
        };
    }

    const grns = await GoodsReceipt.find({ poNumber });
    const invoices = await Invoice.find({ poNumber });

    if (!grns.length || !invoices.length) {
        return {
            status: "insufficient_documents",
            po,
            grns,
            invoices
        };
    }

    const allGrnItems = grns.flatMap(g => g.items);
    const allInvoiceItems = invoices.flatMap(inv => inv.items);

    

    const results = [];
    const reasons = [];

    for (const poItem of po.items) {

        // ---------- BEST GRN MATCH ----------
        let grnItem = null;
        let bestGrnIndex = -1;
        let bestGrnScore = 0;

        for (let i = 0; i < allGrnItems.length; i++) {

            const item = allGrnItems[i];

            let score = 0;

            if (
                item.itemCode &&
                poItem.itemCode &&
                item.itemCode === poItem.itemCode
            ) {
                score = 100;
            } else {
                const similarity = stringSimilarity.compareTwoStrings(
    normalize(item.description),
    normalize(poItem.description)
);

score = similarity * 100;

// Bonus for important keywords
if (
    normalize(item.description).includes("original") &&
    normalize(poItem.description).includes("original")
) score += 10;

if (
    normalize(item.description).includes("spicy") &&
    normalize(poItem.description).includes("spicy")
) score += 10;

if (
    normalize(item.description).includes("veg") &&
    normalize(poItem.description).includes("veg")
) score += 10;
            }

            if (score > bestGrnScore) {
                bestGrnScore = score;
                bestGrnIndex = i;
                grnItem = item;
            }
        }

        if (bestGrnScore < 70) {
            grnItem = null;
        }


        let invoiceItem = null;
        let bestInvoiceIndex = -1;
        let bestInvoiceScore = 0;

        for (let i = 0; i < allInvoiceItems.length; i++) {

            const item = allInvoiceItems[i];

            let score = 0;

            if (
                item.itemCode &&
                poItem.itemCode &&
                item.itemCode === poItem.itemCode
            ) {
                score = 100;
            } else {
                score =
                    stringSimilarity.compareTwoStrings(
                        normalize(item.description),
                        normalize(poItem.description)
                    ) * 100;
            }

            if (score > bestInvoiceScore) {
                bestInvoiceScore = score;
                bestInvoiceIndex = i;
                invoiceItem = item;
            }
        }

        if (bestInvoiceScore < 70) {
            invoiceItem = null;
        }


        let itemStatus = "matched";
        const itemReasons = [];

                // Validation checks

        if (!grnItem) {
            itemStatus = "mismatch";
            itemReasons.push("item_missing_in_grn");
            reasons.push("item_missing_in_grn");
        }

        if (!invoiceItem) {
            itemStatus = "mismatch";
            itemReasons.push("item_missing_in_invoice");
            reasons.push("item_missing_in_invoice");
        }

        if (
            grnItem &&
            grnItem.receivedQuantity > poItem.quantity
        ) {
            itemStatus = "mismatch";
            itemReasons.push("grn_qty_exceeds_po_qty");
            reasons.push("grn_qty_exceeds_po_qty");
        }

        if (
            invoiceItem &&
            invoiceItem.quantity > poItem.quantity
        ) {
            itemStatus = "mismatch";
            itemReasons.push("invoice_qty_exceeds_po_qty");
            reasons.push("invoice_qty_exceeds_po_qty");
        }

        if (
            grnItem &&
            invoiceItem &&
            invoiceItem.quantity > grnItem.receivedQuantity
        ) {
            itemStatus = "mismatch";
            itemReasons.push("invoice_qty_exceeds_grn_qty");
            reasons.push("invoice_qty_exceeds_grn_qty");
        }

        if (
            invoiceItem &&
            Math.abs(invoiceItem.unitPrice - poItem.unitPrice) > 0.05
        ) {
            if (itemStatus !== "mismatch") {
                itemStatus = "partially_matched";
            }

            itemReasons.push("price_mismatch");
            reasons.push("price_mismatch");
        }

        results.push({
            itemCode: poItem.itemCode,
            description: poItem.description,

            poQuantity: poItem.quantity,
            grnQuantity: grnItem?.receivedQuantity || 0,
            invoiceQuantity: invoiceItem?.quantity || 0,

            poPrice: poItem.unitPrice,
            invoicePrice: invoiceItem?.unitPrice || 0,

            status: itemStatus,
            reasons: itemReasons
        });

    }



    const matched = results.filter(i => i.status === "matched").length;
    const partial = results.filter(i => i.status === "partially_matched").length;
    const mismatch = results.filter(i => i.status === "mismatch").length;

    let overallStatus = "matched";

    if (mismatch > 0) {
        overallStatus = "mismatch";
    } else if (partial > 0) {
        overallStatus = "partially_matched";
    }

    return {
        poNumber,

        overallStatus,

        summary: {
            total: results.length,
            matched,
            partiallyMatched: partial,
            mismatched: mismatch
        },

        reasons: [...new Set(reasons)],

        items: results
    };
};