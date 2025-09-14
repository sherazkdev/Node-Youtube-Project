const errorHander = (error,req,res,next) => {

    return res.status(error?.statusCode || 500).json({
        message:error.message,
        success:false,
        statusCode:error.statusCode,
        stack:error.stack
    })

}

export default errorHander;