const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


dotenv.config();

const connectDB = require("./config/db");
const uploadRoutes = require("./routes/uploadRoutes");
const matchRoutes = require("./routes/matchRoutes");



// Connect to MongoDB
connectDB();

const PurchaseOrder = require("./models/PurchaseOrder");

async function testDB() {
    const count = await PurchaseOrder.countDocuments();
    console.log("Purchase Orders:", count);
}

testDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/match", matchRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("🚀 FiniFi Three-Way Matching API is Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});