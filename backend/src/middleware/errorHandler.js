export function errorHandler(error, req, res, next) {
  console.error(error)
  const status = error.status || 500
  res.status(status).json({
    message: error.message || '服务器内部错误',
  })
}
