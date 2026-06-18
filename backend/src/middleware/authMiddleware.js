import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // 2. Cryptographically verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user and attach them to the request context (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user no longer exists" });
      }

      // 4. Automatically inject the exact tenant context securely from the database!
      req.tenantId = req.user.tenantId;

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed or expired" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};
