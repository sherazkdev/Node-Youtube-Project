import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import asyncHandler from "../utils/AsyncHanlder.js";
import ApiError from "../utils/ApiError.js";



const verifyJsonWebToken = asyncHandler( async (req,res,next) => {
    try {

        const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
        if(!token){
            throw new ApiError(404,"Unauthorized Request");
        }

        const verifyJwt = jwt.verify(token,process.env.ACCESS_SECRET_TOKEN);

        if(!verifyJwt) {
            throw new ApiError(402,"Jwt Is Not Verifed")
        }
        const checkTheUserInDb = await UserModel.findById(verifyJwt._id).select("-password -refreshToken");
    
        if(!checkTheUserInDb){
            throw new ApiError(404,"User Not Found Error From verifyJsonWebToekns")
        }

        req.user = checkTheUserInDb;

        next();


    } catch (error) {
        throw new ApiError(401,error.message)
    }
} )

const checkUserIsLoggedIn = asyncHandler( async(req,res,next) => {
    
    const userToken = req.cookies?.accessToken;
    if(!userToken) {
        return next();
    }
    const verifyJwt = jwt.verify(userToken,process.env.ACCESS_SECRET_TOKEN);

    if(!verifyJwt) {
        throw new ApiError(402,"Jwt Is Not Verifed")
    }
    const checkTheUserInDb = await UserModel.findById(verifyJwt._id).select("-password -refreshToken");

    if(!checkTheUserInDb){
        throw new ApiError(404,"User Not Found Error From verifyJsonWebToekns")
    }

    req.user = checkTheUserInDb;

    next();

})

export {verifyJsonWebToken,checkUserIsLoggedIn}
