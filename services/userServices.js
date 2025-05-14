const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../handy/jwt");

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const salt = Number(process.env.SALT_ROUNDS) || 10;

// Get all users (protected) - excludes passwords
router.get("/users/all", verifyToken, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (protected) - excludes password
router.get("/users/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sign up
router.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "30d",
    });

    res.status(201).json({ 
      message: "User created successfully",
      token 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Sign in
router.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "30d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (protected)
router.delete("/users/:id", verifyToken, async (req, res) => {
  try {
    // Users can only delete their own account
    if (req.params.id !== req.user.userId.toString()) {
      return res.status(403).json({ 
        message: "You can only delete your own account" 
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
