
    const asyncHandler = ( asyncHalder ) => {
        return (req,res,next) => {
            Promise.resolve( asyncHalder(req,res,next) ).catch((error) => next(error))
        }
    }


// const asyncHalder = ( fn ) => {
    
//     try {
        
//         return async (req,res,next) => {
//             await fn(req,res,res);
//         }
        
//     } catch (error) {
//         return res.status( error.code || 500).json({
//             message:error.message,
//             success:false,
//         })
//     }
// }

export default asyncHandler;