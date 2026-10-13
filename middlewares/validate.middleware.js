import { fail } from "../utils/response.js";

/**
 * Validate request data against a Zod schema.
 * @param {ZodSchema} schema  - Zod schema to validate against
 * @param {"body"|"query"} source - Where to read data from (default: "body")
 *
 * NOTE (Express 5): req.query is read-only (getter-only on IncomingMessage).
 * Parsed query params are stored in req.validatedQuery instead.
 * Parsed body data is stored in req.body as before.
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      return fail(res, "Validation failed", 422, result.error.errors);
    }

    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
}
