/**
 * Success envelope for /api/v1 carpool APIs.
 */
function ok(res, data = null, message = '', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Request failed',
    data: err.code ? { code: err.code } : null,
  });
}

module.exports = { ok, fail };
