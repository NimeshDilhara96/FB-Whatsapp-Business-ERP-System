import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation Error",
        errors: err.issues.map(e => e.message)
      });
    }
    return res.status(500).json({ message: "Internal Validation Error" });
  }
};
