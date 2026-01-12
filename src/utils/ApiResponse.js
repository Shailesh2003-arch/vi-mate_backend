class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    ((this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      // look for this property of success.
      (this.success = statusCode < 400));
  }
}

export default ApiResponse;
