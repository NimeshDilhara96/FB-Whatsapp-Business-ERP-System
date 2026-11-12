import { z } from "zod";

const handleValidationError = (err, res) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation Error",
      errors: err.issues.map((e) => e.message),
    });
  }
  return res.status(500).json({ message: "Internal Validation Error" });
};

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return handleValidationError(err, res);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (err) {
    return handleValidationError(err, res);
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.validatedParams = schema.parse(req.params);
    next();
  } catch (err) {
    return handleValidationError(err, res);
  }
};
