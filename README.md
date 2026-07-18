# Three-Way Match Engine

An AI-powered backend service that performs **Three-Way Matching** between Purchase Orders (PO), Goods Receipt Notes (GRN), and Invoices using **Node.js**, **Express**, **MongoDB**, and **Google Gemini API**.

The application extracts structured information from uploaded PDF documents using Gemini AI, stores the extracted data in MongoDB, and validates the documents using item-level three-way matching.

---

# Objective

The objective of this project is to build a backend service capable of extracting structured information from Purchase Orders (PO), Goods Receipt Notes (GRN), and Invoices using Google Gemini AI, storing the extracted data in MongoDB, and performing automated item-level three-way matching based on business validation rules.

# Features

- Upload Purchase Orders (PO)
- Upload Goods Receipt Notes (GRN)
- Upload Invoices
- AI-based PDF data extraction using Google Gemini
- Automatic structured JSON generation
- MongoDB document storage
- Item-level three-way matching
- Supports multiple GRNs and multiple invoices
- Handles out-of-order document uploads
- Returns detailed match summary and mismatch reasons

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Google Gemini API
- Multer
- pdf-parse
- string-similarity

---
## Major Libraries

- express
- mongoose
- multer
- pdf-parse
- @google/genai
- string-similarity
- dotenv

  # MongoDB Collections

The application stores data in separate collections.

- PurchaseOrders
- GoodsReceipts
- Invoices
- MatchResults

# Project Structure

```
├── config
│   └── db.js
├── controllers
│   ├── uploadController.js
│   └── matchController.js
├── middleware
│   └── upload.js
├── models
│   ├── PurchaseOrder.js
│   ├── GoodsReceipt.js
│   ├── Invoice.js
│   └── MatchResult.js
├── routes
│   ├── uploadRoutes.js
│   └── matchRoutes.js
├── services
│   ├── geminiService.js
│   └── matchService.js
├── app.js
├── package.json
└── README.md
```

---

# System Workflow

1. User uploads a PDF document.
2. Multer stores the uploaded file temporarily.
3. pdf-parse extracts raw text from the PDF.
4. Google Gemini converts the text into structured JSON.
5. Parsed data is stored in MongoDB.
6. Documents are linked using the Purchase Order Number.
7. Three-Way Matching is automatically performed whenever related documents become available.
8. Match results are stored and returned through the Match API.

---
                +----------------+
                |    Client      |
                +----------------+
                        |
                        |
              POST /documents/upload
                        |
                        ▼
                 Express Server
                        |
          +-------------+-------------+
          |                           |
          ▼                           ▼
     pdf-parse                 Google Gemini API
          |                           |
          +-------------+-------------+
                        |
                 Structured JSON
                        |
                        ▼
                  MongoDB Atlas
                        |
                        ▼
                Three-Way Match Engine
                        |
                        ▼
             GET /api/match/:poNumber
                        |
                        ▼
                 Match Result (JSON)
                 

# Data Model

## Purchase Order

```
{
  poNumber,
  poDate,
  vendorName,
  items:[
      {
         itemCode,
         description,
         quantity
      }
  ]
}
```

## Goods Receipt Note

```
{
  grnNumber,
  poNumber,
  grnDate,
  items:[
      {
         itemCode,
         description,
         receivedQuantity
      }
  ]
}
```

## Invoice

```
{
  invoiceNumber,
  poNumber,
  invoiceDate,
  items:[
      {
         itemCode,
         description,
         quantity
      }
  ]
}
```

---

# Parsing Flow

The uploaded PDF is first converted into text using **pdf-parse**.

The extracted text is then sent to **Google Gemini API** with a prompt requesting structured JSON.

Gemini extracts fields such as:

- Purchase Order Number
- Vendor Name
- Dates
- Item Description
- SKU / Item Code
- Quantity

The structured JSON is validated before being stored in MongoDB.

---

# Matching Logic

Matching is performed at the **item level**.

### Item Matching Key

The matching engine primarily uses:

- Item Code / SKU

If an Item Code is unavailable, the system compares normalized item descriptions using string similarity to identify matching items.

---

# Validation Rules

The matching engine validates:

- GRN quantity must not exceed PO quantity.
- Invoice quantity must not exceed PO quantity.
- Invoice quantity must not exceed total GRN quantity.
- Invoice date must not be later than PO date.

Possible overall match statuses:

- matched
- partially_matched
- mismatch
- insufficient_documents

Mismatch reasons include:

- grn_qty_exceeds_po_qty
- invoice_qty_exceeds_po_qty
- invoice_qty_exceeds_grn_qty
- invoice_date_after_po_date
- item_missing_in_po

---

## Matching Strategy

The application first attempts to match items using the Item Code (SKU).

If an Item Code is unavailable, item descriptions are normalized and compared using string similarity.

Normalization includes:

- converting text to lowercase
- removing special characters
- removing extra spaces

This approach improves matching accuracy when document descriptions differ slightly while still referring to the same product.

# Handling Out-of-Order Uploads

Documents are stored independently using the Purchase Order Number.

Since all documents are linked by **poNumber**, uploads can occur in any order:

- PO first
- GRN first
- Invoice first

Whenever a related document is uploaded, the matching engine automatically recalculates the latest match result.

---

# Postman Collection

A Postman collection is included in this repository for testing the APIs.

**File:**

```
Three-Way-Match-Engine.postman_collection.json
```

Import this collection into Postman and use the provided requests to test the application.

The collection includes:

- POST `/documents/upload`
- GET `/api/match/:poNumber`

## Upload Document

POST

```
/documents/upload
```

### Form Data

```
file
documentType
```

Example documentType

```
po
grn
invoice
```

---

## Get Parsed Document

GET

```
/documents/:id
```

Returns the stored parsed document.

---

## Get Match Result

GET

```
/api/match/:poNumber
```

Returns

- Linked documents
- Match status
- Summary
- Item level results
- Reasons for mismatches

---

# Sample Match Response

```json
{
  "poNumber": "PO001",
  "overallStatus": "matched",
  "summary": {
    "total": 12,
    "matched": 10,
    "partiallyMatched": 1,
    "mismatched": 1
  },
  "reasons": [],
  "items": []
}
```

---

# Error Handling

The application handles common errors such as:

- Invalid document type
- Missing file upload
- Gemini API failures
- MongoDB connection errors
- Missing Purchase Order
- Missing related documents
- Invalid API requests

# Assumptions

- Each Purchase Order Number is unique.
- One Purchase Order exists per poNumber.
- Multiple GRNs are allowed.
- Multiple Invoices are allowed.
- Gemini extracts accurate structured data.
- Item descriptions may vary slightly, therefore normalized text similarity is used as a fallback.

---

# Trade-offs

- String similarity may occasionally match similar but different products.
- Gemini extraction accuracy depends on PDF quality.
- The project focuses on backend functionality rather than production-scale optimization.

---

# Future Improvements

- OCR support for scanned PDFs.
- Authentication and authorization.
- Swagger/OpenAPI documentation.
- Docker support.
- Unit and integration testing.
- Confidence scoring for AI extraction.
- Asynchronous job queue for large document processing.
- Real-time notifications after matching.

---
# How to Run the Project

## Prerequisites

Before running the project, ensure the following software is installed on your system:

- Node.js (v18 or later)
- npm (comes with Node.js)
- MongoDB Atlas account (or a local MongoDB instance)
- Google Gemini API Key

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Application server port |
| MONGODB_URI | MongoDB connection string |
| GEMINI_API_KEY | Google Gemini API Key |

## HTTP Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Request successful |
| 201 | Document uploaded successfully |
| 400 | Invalid request or missing parameters |
| 404 | Purchase Order not found |
| 500 | Internal server error |

## Step 1: Clone the Repository

```bash
git clone https://github.com/prajuu020/finifi-three-way-match.git
```

Navigate to the project directory:

```bash
cd finifi-three-way-match
```

---

## Step 2: Install Dependencies

Install all required Node.js packages:

```bash
npm install
```

---

## Step 3: Configure Environment Variables

Create a file named `.env` in the project root directory.

Add the following variables:

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

GEMINI_API_KEY=your_gemini_api_key
```

Replace:

- `your_mongodb_connection_string` with your MongoDB Atlas connection string.
- `your_gemini_api_key` with your Google Gemini API key.

---

## Step 4: Start the Server

To start the application:

```bash
npm start
```

or, if using Nodemon:

```bash
npm run dev
```

If everything is configured correctly, you should see:

```
MongoDB Connected
Server running on port 3000
```

---

## Step 5: Test the APIs

### Upload a Document

**Endpoint**

```
POST /documents/upload
```

**URL**

```
http://localhost:3000/documents/upload
```

**Body**

Select **form-data** and provide:

| Key | Type | Value |
|------|------|-------|
| file | File | Select a PDF file |
| documentType | Text | po / grn / invoice |

Example:

```
documentType = po
```

Upload the Purchase Order PDF first, followed by the GRN and Invoice PDFs. Documents may also be uploaded in any order because the system automatically links them using the Purchase Order Number.

---

### Get Match Result

**Endpoint**

```
GET /api/match/:poNumber
```

Example:

```
http://localhost:3000/api/match/CI4PO05788
```

This API returns:

- Overall Match Status
- Match Summary
- Item-Level Matching Results
- Validation Errors (if any)

---

## Example Workflow

1. Start the server.
2. Upload a Purchase Order PDF.
3. Upload one or more Goods Receipt Note PDFs.
4. Upload one or more Invoice PDFs.
5. Call the Match API using the Purchase Order Number.
6. View the three-way matching result, including validation status and mismatch reasons.

---

## Stop the Server

Press:

```
Ctrl + C
```

in the terminal to stop the server.

# Conclusion

This project demonstrates an AI-assisted backend solution for automating the Three-Way Matching process using Node.js, Express, MongoDB, and Google Gemini.

The application supports document parsing, structured data extraction, out-of-order document uploads, and automated item-level validation while maintaining a clean and modular backend architecture.
