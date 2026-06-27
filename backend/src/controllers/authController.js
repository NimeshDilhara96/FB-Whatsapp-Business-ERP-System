import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

// Helper to set cookie
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// TENANT REGISTRATION
export const registerTenant = async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body;

    // 1. Check if user already exists across the system
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // 2. Auto-generate a unique tenant ID (e.g. 16 char hex string)
    const generatedTenantId = crypto.randomBytes(8).toString("hex");

    // 3. Create the Tenant (Workspace)
    const newTenant = await Tenant.create({
      tenantId: generatedTenantId,
      companyName,
    });

    // 4. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the User linked to the new Tenant
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tenantId: newTenant.tenantId,
      role: "admin",
    });

    // 6. Generate the JWTs
    const { accessToken, refreshToken } = generateTokens(user);

    // 7. Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // 8. Set HttpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "Workspace and Admin created successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        companyName: newTenant.companyName,
        currency: newTenant.currency || "Rs.",
        subscription: newTenant.subscription,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // We can confidently locate them by their unique email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    // Fetch the tenant to get the company name
    const tenant = await Tenant.findOne({ tenantId: user.tenantId });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        companyName: tenant ? tenant.companyName : "Unknown Workspace",
        currency: tenant ? tenant.currency : "Rs.",
        subscription: tenant ? tenant.subscription : null,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REFRESH TOKEN
export const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find user with matching refresh token
    const user = await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during logout" });
  }
};