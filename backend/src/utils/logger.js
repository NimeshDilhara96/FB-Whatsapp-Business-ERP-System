import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "body.password",
      "body.token",
      "body.accessToken",
      "body.refreshToken",
      "body.cardNumber",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.cookie",
      "*.authorization",
      "password"
    ],
    censor: "[Redacted]",
  },
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
