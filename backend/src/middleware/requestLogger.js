import crypto from "crypto";
import pinoHttp from "pino-http";
import logger from "../utils/logger.js";

// Validate incoming request ID: Must be alphanumeric/hyphens and max 36 chars (e.g. UUID)
const isValidRequestId = (id) => {
  return typeof id === "string" && /^[a-zA-Z0-9-]{10,36}$/.test(id);
};

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    // Check for existing valid X-Request-ID
    const existingId = req.headers["x-request-id"];
    
    let reqId;
    if (isValidRequestId(existingId)) {
      reqId = existingId;
    } else {
      reqId = crypto.randomUUID();
    }
    
    // Attach to request context
    req.id = reqId;
    
    // Attach to response headers
    res.setHeader("X-Request-ID", reqId);
    
    return reqId;
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    }
    return "info";
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return "request completed";
  },
  customErrorMessage: (req, res, err) => {
    return "request errored";
  },
  // Omit body and unnecessary excessive data
  serializers: {
    req: (req) => {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res: (res) => {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
