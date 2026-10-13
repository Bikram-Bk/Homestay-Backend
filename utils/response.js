export function ok(res, data = null, message = "OK", status = 200, meta = null) {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(status).json(body);
}

export function fail(res, message = "Error", status = 400, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(status).json(body);
}
