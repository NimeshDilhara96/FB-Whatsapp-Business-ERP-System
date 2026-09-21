# OrderFlow Observability

This document details the observability implementation for the OrderFlow backend.

## 1. Golden Signals

- **Latency**: Monitored via Pino-HTTP response times (`responseTime` field in structured logs).
- **Traffic**: Logged automatically via Pino-HTTP for every incoming request (excluding static assets if applicable).
- **Errors**: HTTP 4xx and 5xx responses are logged with appropriate levels (`warn` and `error`). Unhandled exceptions are automatically captured and sent to Sentry (if `SENTRY_DSN` is configured).
- **Saturation**: Currently tracked via Render's built-in metric dashboards (CPU/Memory). The `/api/health` endpoint exposes basic Node.js memory metrics if needed for uptime checks.

## 2. Provisional Service Level Objectives (SLOs)

*Note: These are initial targets and provisional. They must be validated against actual production load over time.*

- **Availability**: 99.9% target for core API endpoints.
- **Latency (p99)**: < 500ms for critical paths (e.g., creating an order).
- **Error Rate**: < 1% of all requests returning 5xx.

## 3. Alerting

- **Error Alerts**: Handled by **Sentry**. Sentry will notify developers of new, unhandled exceptions and spikes in 5xx errors.
- **Saturation/Infrastructure Alerts**: Handled by **Render**. Render alerts will trigger if memory or CPU thresholds are exceeded.

## 4. Distributed Tracing Assessment

Currently, OrderFlow uses a single monolithic Node.js backend connecting to a single MongoDB cluster. Therefore, **Distributed Tracing (e.g., OpenTelemetry) is not applicable at this stage.** 
If we adopt a microservice architecture or introduce significant external downstream services in the future, we will reconsider implementing distributed tracing.

## 5. Security & PII

- A unique `X-Request-ID` is attached to every request and log entry.
- `x-forwarded-for` is explicitly NOT used as a request ID.
- Strict Pino redaction is configured to ensure passwords, cookies, tokens, and authorization headers are never logged.
- Full request and response bodies are omitted from standard traffic logs.
