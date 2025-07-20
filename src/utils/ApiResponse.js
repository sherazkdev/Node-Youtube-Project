class apiResponse {
    constructor(
        data,
        success = true,
        message = "Success",
        statusCode,
    ){
        this.statusCode = statusCode;
        this.success = success;
        this.message = message;
        this.data = data;
    }
}

export default apiResponse;