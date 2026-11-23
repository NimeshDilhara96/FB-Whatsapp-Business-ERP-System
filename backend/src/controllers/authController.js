import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Helper to hash refresh tokens with SHA-256 before storing/comparing in MongoDB
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Verify Cloudflare Turnstile token
const verifyTurnstileToken = async (token, remoteIp) => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
};

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

// Cookie options are resolved lazily (after dotenv has loaded).
// Production default is SameSite=None because the frontend and the API live on different
// sites (e.g. orderflow.mommentx.space -> onrender.com). CSRF is covered by the Origin
// allowlist + X-Requested-With check in server.js.
// Once the API is served from a sibling subdomain (api.mommentx.space), set
// COOKIE_SAMESITE=lax (and optionally COOKIE_DOMAIN=.mommentx.space) on the backend.
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");
  const options = {
    httpOnly: true,
    secure: isProduction || sameSite === "none",
    sameSite,
  };
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
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

    // 2.5 Generate a unique shopSlug
    const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const shopSlug = `${baseSlug}-${randomSuffix}`;

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the User linked to the new Tenant first
    // This prevents duplicate tenants if multiple requests are made simultaneously,
    // as the User unique email constraint will fail the concurrent request before a Tenant is created.
    let user;
    try {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        tenantId: generatedTenantId,
        role: "admin",
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: "Email is already registered" });
      }
      throw error;
    }

    // 5. Create the Tenant (Workspace)
    let newTenant;
    try {
      newTenant = await Tenant.create({
        tenantId: generatedTenantId,
        companyName,
        shopSlug,
      });
    } catch (error) {
      // Rollback: if Tenant creation fails for any reason, delete the user we just created
      await User.findByIdAndDelete(user._id);
      throw error;
    }

    // 6. Generate the JWTs
    const { accessToken, refreshToken } = generateTokens(user);

    // 7. Save hashed refresh token to user
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    // 8. Set HttpOnly cookies
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);

    res.status(201).json({
      message: "Workspace and Admin created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        companyName: newTenant.companyName,
        shopSlug: newTenant.shopSlug,
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
    const { email, password, turnstileToken } = req.body;

    const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!isHuman) {
      return res.status(400).json({
        message: "Security challenge verification failed. Please try again.",
      });
    }

    // We can confidently locate them by their unique email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Fetch the tenant to verify workspace status and get company details
    const tenant = await Tenant.findOne({ tenantId: user.tenantId });

    if (
      user.role !== "superadmin" &&
      tenant?.subscription?.status === "Suspended"
    ) {
      return res.status(403).json({
        message: "Your workspace has been suspended. Please contact support.",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save hashed refresh token to DB
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    // Set cookies
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        companyName: tenant ? tenant.companyName : "Unknown Workspace",
        shopSlug: tenant ? tenant.shopSlug : null,
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

    // Find user with matching hashed refresh token
    const hashedRefreshToken = hashToken(refreshToken);
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: hashedRefreshToken,
    });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (user.role !== "superadmin") {
      const tenant = await Tenant.findOne({ tenantId: user.tenantId });
      if (!tenant || tenant.subscription?.status === "Suspended") {
        user.refreshToken = null;
        await user.save();
        res.clearCookie("refreshToken", getCookieOptions());
        res.clearCookie("accessToken", getCookieOptions());
        return res.status(403).json({
          message: "Your workspace has been suspended. Please contact support.",
        });
      }
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update hashed refresh token in DB
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    // Set new cookies
    setRefreshTokenCookie(res, newRefreshToken);
    setAccessTokenCookie(res, accessToken);

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken);
      const user = await User.findOne({ refreshToken: hashedRefreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("refreshToken", getCookieOptions());
    res.clearCookie("accessToken", getCookieOptions());

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during logout" });
  }
};

// GET CURRENT USER (/me)
export const getMe = async (req, res) => {
  try {
    const user = req.user; // Available from authMiddleware
    const tenant = await Tenant.findOne({ tenantId: user.tenantId });

    if (!tenant) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (
      user.role !== "superadmin" &&
      tenant.subscription?.status === "Suspended"
    ) {
      return res.status(403).json({
        message: "Your workspace has been suspended. Please contact support.",
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        companyName: tenant.companyName,
        shopSlug: tenant.shopSlug,
        currency: tenant.currency || "Rs.",
        subscription: tenant.subscription,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};