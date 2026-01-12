// Node,js provides you with an ApiError class.

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong!",
    errors = [],
    stack = ""
  ) {
    //   this is the message that is passed when the instance is initiated from the class ApiError with the help of the base class Error
    super(message);
    this.statusCode = statusCode;
    //   this is an optional parameter.
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
