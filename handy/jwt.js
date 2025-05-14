const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const jwtSecret = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Remove 'Bearer ' if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

    const decoded = jwt.verify(tokenString, jwtSecret);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Store user info in request
    req.user = {
      userId: user._id,
      email: user.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { verifyToken };
