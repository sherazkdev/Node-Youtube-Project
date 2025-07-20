class ApiError extends Error {
    statusCode = Number;
    message = String;
    error = Array;

    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor); // ✅ fixed spelling
        }
    }
}

export default ApiError;
