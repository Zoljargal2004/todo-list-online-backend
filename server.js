require("dotenv").config();
const express = require("express");
const { dbConnect } = require("./db");
const userRouter = require("./services/userServices");
const groupRouter = require("./services/groupServices");
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// API Routes with prefix
app.use(userRouter);
app.use(groupRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Initialize server with database connection
const startServer = async () => {
  try {
    await dbConnect();

    app.listen(PORT, () => {
      console.log(`Server started at port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
