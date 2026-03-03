import AppError from '../utils/AppError.js';

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFields = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`Duplicate value for field "${field}": "${value}" already exists`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token — please log in again', 401);
const handleJWTExpiredError = () => new AppError('Your session has expired — please log in again', 401);

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
  } else {
    console.error('💥 UNEXPECTED ERROR:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    if (error.name === 'CastError')           error = handleCastError(error);
    if (error.code === 11000)                 error = handleDuplicateFields(error);
    if (error.name === 'ValidationError')     error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError')   error = handleJWTError();
    if (error.name === 'TokenExpiredError')   error = handleJWTExpiredError();
    sendProdError(error, res);
  }
};

export default globalErrorHandler;