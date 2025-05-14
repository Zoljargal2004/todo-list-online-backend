const express = require("express");
const User = require("../models/userModel");
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../handy/jwt");

const jwtSecret = process.env.JWT_SECRET;
const salt = Number(process.env.SALT_ROUNDS);

// Get all users
userRouter.get("/users/all", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
userRouter.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
userRouter.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

userRouter.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const id = user._id.toString();
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "30d",
    });

    // Send only the token as the response
    return res.json({ token }); // Remove the next res.json call
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Update user
// userRouter.put("/:id", async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// Delete user
userRouter.delete("/users/delete/:id", verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, jwtSecret);
    if (req.params.id != decoded.userId) {
      return res.status(400).json({ sucess: false });
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



module.exports = userRouter;
