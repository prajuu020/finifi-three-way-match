const fs = require("fs");
const pdfParse = require("pdf-parse");
const ai = require("../services/geminiService");

const Purchase = require("../models/PurchaseOrder");
const GoodsReceipt = require("../models/GoodsReceipt");
const Invoice = require("../models/Invoice");

exports.uploadFile = async (req, res) => {
    try {
        // Check file upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Read uploaded PDF
        const dataBuffer = fs.readFileSync(req.file.path);

        // Extract text from PDF
        const pdfData = await pdfParse(dataBuffer);
        const pdfText = pdfData.text;

        console.log("Document Type:", req.body.documentType);
        console.log("PDF Text Length:", pdfText.length);
        console.log("First 500 Characters:");
        console.log(pdfText.substring(0, 500));

        // Prompt for Gemini
  const prompt = `
You are an expert data extraction system.

Extract structured JSON from the ${req.body.documentType.toUpperCase()} document.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanation.
- Preserve exact values from the document.

Purchase Order JSON:

{
  "poNumber":"",
  "vendorName":"",
  "poDate":"",
  "items":[
    {
      "itemCode":"",
      "description":"",
      "quantity":0,
      "unitPrice":0
    }
  ]
}

Goods Receipt JSON:

{
  "grnNumber":"",
  "poNumber":"",
  "grnDate":"",
  "items":[
    {
      "itemCode":"",
      "description":"",
      "receivedQuantity":0
    }
  ]
}

Invoice JSON:

{
  "invoiceNumber":"",
  "poNumber":"",
  "invoiceDate":"",
  "items":[
    {
      "itemCode":"",
      "description":"",
      "quantity":0,
      "unitPrice":0
    }
  ]
}

For Purchase Orders:

The table columns are:

S.No | Item Code | Item Description | HSN Code | Qty | MRP | Unit Base Cost

Extract ONLY:

- itemCode = Item Code
- description = Item Description
- quantity = Qty
- unitPrice = Unit Base Cost

Ignore:
- S.No
- HSN Code
- MRP

Document:

${pdfText}
`;

        // Call Gemini
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
        });

        // Get Gemini response
let extractedData = response.text;

// Remove markdown if present
extractedData = extractedData
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

// Convert string to JSON object
extractedData = JSON.parse(extractedData);

// Save Purchase Order to MongoDB
let savedDocument;

switch (req.body.documentType.toLowerCase()) {

    case "po":

    savedDocument = await Purchase.findOneAndUpdate(
        { poNumber: extractedData.poNumber },
        extractedData,
        {
            new: true,
            upsert: true
        }
    );

    break;

        case "grn":

    savedDocument = await GoodsReceipt.findOneAndUpdate(
    { grnNumber: extractedData.grnNumber },
    extractedData,
    {
        new: true,
        upsert: true
    }
);
    break;

    case "invoice":

    savedDocument = await Invoice.findOneAndUpdate(
        { invoiceNumber: extractedData.invoiceNumber },
        extractedData,
        {
            new: true,
            upsert: true
        }
    );

    break;

    default:
        return res.status(400).json({
            success: false,
            message: "Invalid document type"
        });
}

return res.status(200).json({
    success: true,
    message: `${req.body.documentType.toUpperCase()} saved successfully`,
    data: savedDocument
});

    } catch (error) {
        console.error("Upload Controller Error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};