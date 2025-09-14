import ApiError from "../utils/ApiError.js";
import UserModel from "../models/user.model.js";
import {uploadFile as uploadCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import subscriptionModel from "../models/subscription.model.js";
import VideoModel from "../models/video.model.js"
import mongoose from "mongoose";
import asyncHandler from "../utils/AsyncHandler.js";
import e from "express";

const genrateAccessTokenAndRefreshToken = async ( userId ) => {
    try {
        
        const user = await UserModel.findById(userId);
        
        if(!user) {
            throw new ApiError(404,"User Not Found");
        }
        const AccessToken = await user.genrateAccessToken();
        const RefreshToken = await user.genrateRefreshToken();


        user.refreshToken = RefreshToken;

        await user.save({validateBeforeSave:false})
        
        return { RefreshToken, AccessToken }; 

    } catch (error) {
        throw new ApiError(500,error.message || "Some Thing is wrong in genrateAccessTokenAndRefreshToken ");
    }
};

const registerUser = asyncHandler( async (req,res) => {
    // First Check Return Null Variables
    // Second Upload Images, Mean Avator is Compalsiry
    // Check User Exist Already
    // Hashed Password
    // User Creations
    // Throw Error With Using ApiError
    // Throw Response With Using ApiResponse
    // save cookies and creare json web token to create a square and power full token 


    const {username,fullname,password,email} = req.body;

    // check null fields
    if( [fullname,username,password,email].some( ( field ) => field.trim() == "" ) ){
        
        throw new ApiError(400,"All Fields Required");
    }
    // check User Exist whith Two Options Email Or Username
    const checkUserExistAlready = await UserModel.findOne({
        $or:[ {email:email} , {username:username} ]
    });


    if(checkUserExistAlready){
        throw new ApiError(409,"User Already Exist With User Name Or Email");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    
    if(req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        checkUserExistAlready = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Field is Required");
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);
    

    if(!avatar){
        throw new ApiError(400,"Avatar is required");
    }

    // User Add In Db

    const user = await UserModel.create({
        fullname,
        username : username.toLowerCase(),
        email,
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
    });

    const createdUser = await UserModel.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Some Thing Wrong Sever Is Down Try After Some Times");
    }

    return res.status(201).json(
        new ApiResponse(createdUser,true,"User Successfully Created",200)
    );


});

const loginUser = asyncHandler( async (req,res) => {
    // Get Form Data
    // Validate Form Data
    // Check User with username Or Email
    // Check Hashed Password Match
    // Create AccessToken And Create Refresh Token
    // Add Refresh Token In Database
    // create Cookies For AccessToken And RefreshToken
    // And Last Return The User


    const {email,username,password} = req.body;
    

    if( !(email || username) ){
        throw new ApiError(400,"Email Or Username Is Required")
    }

    const checkUser = await UserModel.findOne({
        $or : [{email},{username}]
    });
    
    if(!checkUser){
        throw new ApiError(404,"User not Exist");
    }

    const checkHashedPasswordIsMatch = await checkUser.verifyThePassword(password);

    if(!checkHashedPasswordIsMatch){
        throw new ApiError(401,"User Details Not Matched");
    }

    const {RefreshToken, AccessToken } = await genrateAccessTokenAndRefreshToken(checkUser._id);

    const loggedInUser = await UserModel.findOne({_id:checkUser._id}).select("-password -refreshToken");

    const cookiesOptions = {
        httpOnly:true,
        secure:true,
        sameSite:"None"
    };

    return res.status(200)
    .cookie("accessToken",AccessToken,cookiesOptions)
    .cookie("refreshToken",RefreshToken,cookiesOptions)
    .json( new ApiResponse(loggedInUser,true,"User Successfully Logged In",200) )




} );

const searchWatchHistory = asyncHandler(async (req,res) => {
    const {query} = req?.query;
    console.log(query)
    if(!query.trim()){
        throw new ApiError(404,"Query parameters not found");
    }
    
    // const matchWatchHistory = await UserModel.aggregate( [
    //     {
    //         $match : {
    //             _id:new mongoose.Types.ObjectId(req?.user?._id),
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "videos",
    //             let:{query:query},
    //             pipeline:[
    //                 {
    //                     $match : {
    //                         $expr : {
    //                             $or : [    
    //                                 { $regexMatch: { input: "$title", regex: "$$query", options: "i" } },
    //                                 { $regexMatch: { input: "$description", regex: "$$query", options: "i" } }
    //                             ]
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $lookup : {
    //                         from : "users",
    //                         let:{owner:"$owner"},
    //                         pipeline:[
    //                             {
    //                                 $match : {
    //                                     $expr : {
    //                                         $eq : ["$_id","$$owner"]
    //                                     }
    //                                 }
    //                             }
    //                         ],
    //                         as:"owner"
    //                     }
    //                 }
    //             ],
    //             as:"watchHistory"
    //         },
    //     },
    //     {
    //         $project : {
    //             _id:1,
    //             fullname:1,
    //             username:1,
    //             email:1,
    //             avatar:1,
    //             coverImage:1,
    //             watchHistory:{
    //                 $map : {
    //                     input : "$watchHistory",
    //                     as:"history",
    //                     in:{
    //                         _id:"$$history._id",
    //                         videoFile:"$$history.videoFile",
    //                         thumbnail:"$$history.thumbnail",
    //                         title:"$$history.title",
    //                         description:"$$history.description",
    //                         duration:"$$history.duration",
    //                         views:"$$history.views",
    //                         isPublished:"$$history.isPublished",
    //                         createdAt:"$$history.createdAt",
    //                         updatedAt:"$$history.updatedAt",
    //                         owner:{
    //                             _id:{$arrayElemAt : ["$$history.owner._id",0]},
    //                             fullname: {$arrayElemAt : ["$$history.owner.fullname",0] },
    //                             email: {$arrayElemAt : ["$$history.owner.email",0] },
    //                             username: {$arrayElemAt : ["$$history.owner.username",0] },
    //                             avatar: {$arrayElemAt : ["$$history.owner.avatar",0] }
    //                         }

    //                     }
    //                 }
    //             }
    //         }
    //     }
    // ] );
    const matchWatchHistory = await UserModel.aggregate([
        {
            $match : {
                $expr : {
                    $eq : ["$_id",new mongoose.Types.ObjectId(req?.user?._id)]
                }
            }
        },
        {
            $lookup : {
                from : "videos",
                let:{query:query,watchHistory:"$watchHistory"},
                pipeline:[
                    {
                        $match : {
                            $expr : {
                                $and : [
                                    {
                                        $in : ["$_id","$$watchHistory"]
                                    },
                                    {
                                        $or : [
                                            {$regexMatch : {input:"$title",regex:"$$query",options:"i"}},
                                            {$regexMatch : {input:"$description",regex:"$$query",options:"i"}},
                                        ]
                                    },
                                ]
                            }
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            let:{owner:"$owner"},
                            pipeline:[
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$owner"]
                                        }
                                    }
                                }
                            ],
                            as:"owner"
                        }
                    }
                ],
                as:"watchHistory"
            }
        },
        {
            $project : {
                        _id:1,
                        fullname:1,
                        username:1,
                        email:1,
                        avatar:1,
                        coverImage:1,
                        watchHistory:{
                            $map : {
                                input : "$watchHistory",
                                as:"history",
                                in:{
                                    _id:"$$history._id",
                                    videoFile:"$$history.videoFile",
                                    thumbnail:"$$history.thumbnail",
                                    title:"$$history.title",
                                    description:"$$history.description",
                                    duration:"$$history.duration",
                                    views:"$$history.views",
                                    isPublished:"$$history.isPublished",
                                    createdAt:"$$history.createdAt",
                                    updatedAt:"$$history.updatedAt",
                                    owner:{
                                        _id:{$arrayElemAt : ["$$history.owner._id",0]},
                                        fullname: {$arrayElemAt : ["$$history.owner.fullname",0] },
                                        email: {$arrayElemAt : ["$$history.owner.email",0] },
                                        username: {$arrayElemAt : ["$$history.owner.username",0] },
                                        avatar: {$arrayElemAt : ["$$history.owner.avatar",0] }
                                    }
        
                                }
                            }
                        }
            }
        }
    ])

    return res.json(new ApiResponse(matchWatchHistory,true,"search history successfully featched",200))
});

const getSubscribedNotifications = asyncHandler(async (req,res) => {

    const {page=1,limit=20} = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const skip = (pageNumber - 1) * limit;

    // const getNotifications = await UserModel.aggregate( [
    //     {
    //         $match : {
    //             $expr : {
    //                 $eq : ["$_id",new mongoose.Types.ObjectId(req?.user?._id)]
    //             }
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "subscriptions",
    //             let:{userId:"$_id"},
    //             pipeline:[
    //                 {
    //                     $match : {
    //                         $expr : {
    //                             $eq : ["$subscriber","$$userId"]
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $lookup : {
    //                         from : "videos",
    //                         let:{channelId:"$channel"},
    //                         pipeline : [
    //                             {
    //                                 $match : {
    //                                     $expr : {
    //                                         $eq : ["$owner","$$channelId"]
    //                                     }
    //                                 }
    //                             },
    //                             {
    //                                 $sort : {
    //                                     createdAt:-1
    //                                 }
    //                             }
    //                         ],
    //                         as:"notifications"
    //                     }
    //                 }
    //             ],
    //             as:"subscribeTo"
    //         }
    //     }
    // ] );

    const subscribedTo = await subscriptionModel.find({subscriber:new mongoose.Types.ObjectId(req?.user?._id)}).select("channel");
    const channels = subscribedTo.map( (sub) => sub?.channel);
    
    // get all notifications
    const getNotifications = await VideoModel.aggregate( [
        {
            $match : {
                $expr : {
                    $in : ["$owner",channels],
                }
            }
        },
        {
            $lookup : {
                from : "users",
                let:{owner:"$owner"},
                pipeline:[
                    {
                        $match : {
                            $expr : {
                                $eq : ["$_id","$$owner"]
                            }
                        }
                    }
                ],
                as:"owner"
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $sort : {
                createdAt:-1
            }
        },
        {
            $skip : skip
        },
        {
            
        },
        {
            $project : {
                _id:1,
                videoFile:1,
                thumbnail:1,
                description:1,
                title:1,
                createdAt:1,
                views:1,
                duration:1,
                "owner.fullname":1,
                "owner.email":1,
                "owner.username":1,
                "owner.avatar":1,
                

            }
        }
    ] )

    return res.json(new ApiResponse(getNotifications,true,"Subscriptions videos successfully featched",200));

})

const logoutUser = asyncHandler( async (req,res) => {
    // First of All Get user Object
    // remove refreshToken For Db
    // save Db
    // And Last Is Remove all cookies For Web Page
    // Return Null || new ApiResponse(200);

    const UserDetails = req.user;

    const updateUserInfo = await UserModel.findByIdAndUpdate(UserDetails._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new: true
        }   
    );

    const cookiesOptions = {
        httpOnly:true,
        secure:true,
        sameSite:"None"
    };

    return res.status(200)
    .clearCookie("accessToken",cookiesOptions)
    .clearCookie("refreshToken",cookiesOptions)
    .json( new ApiResponse(null,true,"User Logout Successfully",200) )
    


} );

const accessRefreshToken = asyncHandler( async (req,res) => {
    try {

        // check the refresh token
        // verify the refresh token
        // after verify the and check in database user exist
        // after match user refreshtoken and cookie refresh token
        // and after save and return cookies

        const accessToken = req.cookies?.refreshToken;

        if(!accessToken){
            throw new ApiError(401,"Not found AccessToken");
        }

        const decodToken = await jwt.verify(accessToken,process.env.REFRESH_TOKEN_SECRET);

        if(!decodToken){
            
            throw new ApiError(401,"Not Match The Access AccessToken");
        }

        const user = await UserModel.findById(decodToken._id);

        if(!user){
            throw new ApiError(404,"user not found in db");
        }

        // Check TokenIs Match
        if(user.refreshToken !== refreshToken){
            throw new apiError(402,"refresh token is not match")
        }

        const {RefreshToken, newAccessToken} = genrateAccessTokenAndRefreshToken(user._id);

        user.refreshToken = RefreshToken;

        await user.save({new:true});

        const Options = {
            httpOnly:true,
            secure:true,
            sameSite:"None",
        };
            
        return res.status(200)
        .cookie("accessToken",AccessToken,cookiesOptions)
        .cookie("refreshToken",RefreshToken,cookiesOptions)
        .json( new apiResponse({AccessToken:newAccessToken},true,"user refresh token is updated",200) );

        
    } catch (error) {
        throw new ApiError(401,error?.message || "error from accessRefreshToken Catch Hanlder")
    }
} );


const changeUserPassword = asyncHandler( async (req,res) => {

    const {oldPassword,newPassword} = req.body;

    const user = await UserModel.findById(req.user?._id);

    if(!user){
        throw new ApiError(404,"user not found");
    }

    const verifyThePassword = await user.verifyThePassword(oldPassword);
    
    if(!verifyThePassword){
        throw new ApiError(401,"old password is not match");
    }

    user.password = newPassword;

    await await user.save({validateBeforeSave:false});

    const updatedUser = await UserModel.findById(user._id).select("-watchHistory -password -refreshToken");

    return res.status(200)
    .json(new ApiResponse(updatedUser,true,"User Password Updated",200));



} );

const changeAccountDetails = asyncHandler( async (req,res) => {

    const {newEmail,newFullname} = req.body;
    
    if(!newEmail || !newFullname){
        throw new ApiError(402,"fullname ya email is required")
    } 
    
    const user = await UserModel.findByIdAndUpdate(req.user._id,{
        $set : {
            email : newEmail,
            fullname : newFullname
        }
    },{new:true}).select("-password -refreshToken");
    
    if(!user){
        throw new ApiError(500,"Error Somethin went wrong for change user Account detail save user");
    }

    return res.status(200)
    .json( new ApiResponse(user,true,"user account details updated successfully",200))

} );

const getCurrentUser = asyncHandler( async (req,res) => {
    console.log(req.referrer)
    return res.status(200)
    .json(new ApiResponse(req.user,true,"User Profile Data",200))

} );


const changeAvatarImage = asyncHandler( async (req,res) => {

    const avatarLocalPath = req.file?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(402,"has a updating time avatar local path not found");
    }

    const upload = await uploadCloudinary(avatarLocalPath);

    if(!upload){
        return new ApiError(400,"avatar file uploading in cloudnairy not succesfull");
    }


    
    const user = await UserModel.findByIdAndUpdate(req.user?._id,{$set:{avatar:upload.url}},{new:true}).select("-password -refreshToken");


    if(!user){
        throw new ApiError(500,"User Avatar Image not updated")
    }

    return res.status(200)
    .json(new ApiResponse(user,true,"avatar image updated successfully",200))


});

const changeCoverImage = asyncHandler( async (req,res) => {

    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError(402,"has a updating time avatar local path not found");
    }

    const upload = await uploadCloudinary(coverImageLocalPath);

    if(!upload){
        return new ApiError(400,"avatar file uploading in cloudnairy not succesfull");
    }


    
    const user = await UserModel.findByIdAndUpdate(req.user?._id,{$set:{coverImage:upload.url}},{new:true}).select("-password -refreshToken");


    if(!user){
        throw new ApiError(500,"User Avatar Image not updated")
    }

    return res.status(200)
    .json(new ApiResponse(user,true,"avatar image updated successfully",200))


});

const getUserChannelProfile = asyncHandler( async (req,res) => {

    const {username} = req.params;

    if(!username){
        throw new ApiError(404,"channel not Found")
    }

    /* _id = channel,
        mean current User Subscriber
        _id = subscriber
        mean current user subscribed to anonther channel */

    const userChannel = await UserModel.aggregate([

        {
            $match : {
                username : username
            }
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $lookup : {
                
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as: "videos"
            }
        },
        {
            $lookup : {
                from : "videos",
                let:{ownerId:"$_id"},
                pipeline : [
                    {
                        $facet : {
                            latest : [
                                {
                                    $match : {
                                        $expr : { $eq: ["$owner","$$ownerId"]}
                                    }
                                },
                                {
                                    $sort : { createdAt : -1}
                                },
                                {
                                    $limit : 1
                                },
                                {
                                    $lookup : {
                                        from : "users",
                                        let:{owner:"$owner"},
                                        pipeline : [
                                            {
                                                $match : {
                                                    $expr : {
                                                        $eq : ["$_id","$$owner"]
                                                    }
                                                }
                                            }
                                        ],
                                        as:"owner"
                                    }
                                },
                                {
                                    $unwind : "$owner"
                                }
                            ],
                            popular : [
                                {
                                    $match : {
                                        $and : [
                                            {$expr : {$eq : ["$owner","$$ownerId"]}},
                                            {$expr : { $gte : ["$views",1000]}}
                                        ]
                                        
                                    }
                                },
                                {
                                    $sort : { views : -1}
                                },
                                {
                                    $limit : 12
                                },
                                {
                                    $lookup : {
                                        from : "users",
                                        let:{owner:"$owner"},
                                        pipeline : [
                                            {
                                                $match : {
                                                    $expr : {
                                                        $eq : ["$_id","$$owner"]
                                                    }
                                                }
                                            }
                                        ],
                                        as:"owner"
                                    }
                                },      
                                {
                                    $unwind : "$owner"
                                }
                            ],
                            randomVideos : [
                                {
                                    $match : {
                                        $expr : {$eq : ["$owner","$$ownerId"]}
                                    }
                                },
                                {
                                    $limit : 12
                                },
                                {
                                    $lookup : {
                                        from : "users",
                                        let:{owner:"$owner"},
                                        pipeline : [
                                            {
                                                $match : {
                                                    $expr : {
                                                        $eq : ["$_id","$$owner"]
                                                    }
                                                }
                                            }
                                        ],
                                        as:"owner"
                                    }
                                },
                                {
                                    $unwind : "$owner"
                                }
                            ]
                        }
                    }
                ],
                as:"channelVideos"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers",
                },

                totalVideos:{
                    $size : "$videos"
                },

                toSubscribedChannel: {
                    $cond: {
                      if: { $in :  [new mongoose.Types.ObjectId(req.user?._id),"$subscribers.subscriber"]},
                      then: true,
                      else: false
                    }
                }
                  
            }
        },
        {
            $project: {
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribers: 1,
                subscribedTo: 1,
                toSubscribedChannel: 1,
                subscribersCount: 1,
                username: 1,
                allVideos: {
                    latest: { 
                        $arrayElemAt: ["$channelVideos.latest", 0] 
                    },
                    popular: { 
                    $setDifference: [
                        "$channelVideos.popular", 
                        { $setUnion: [{$arrayElemAt: ["$channelVideos.latest", 0]}, "$channelVideos.videos"] }
                    ] 
                    },
                    others: { 
                    $setDifference: [
                        "$channelVideos.randomVideos", 
                        { $setUnion: [{$arrayElemAt: ["$channelVideos.latest", 0]}, "$channelVideos.popular"] }
                    ] 
                }
            }
              
        }
          
        }
    ]);

    if(!userChannel.length > 0  ){
        throw new ApiError(404,"Channel Not Found");
    }

    return res.status(200)
    .json( new ApiResponse(userChannel[0],true,"channel data",200) )

} )

const getWatchHistory = asyncHandler( async (req,res) => {


   const watchHistory = await UserModel.aggregate(  
        [
            {
                $match : {
                    $expr : {
                        $eq : ["$_id",new mongoose.Types.ObjectId(req.user?._id)]
                    }
                }
            },
            {   
                $lookup : {
                    from : "videos",
                    let:{watchHistory:"$watchHistory"},
                    pipeline:[
                        {
                            $match : {
                                $expr : {
                                    $in : ["$_id","$$watchHistory"]
            
                                }
                            }
                        },
                        {
                            $lookup : {
                                from : "users",
                                let:{owner:"$owner"},
                                pipeline:[
                                    {
                                        $match : {
                                            $expr : {
                                                $eq : ["$_id","$$owner"]
                                            }
                                        }
                                    }
                                ],
                                as:"owner"
                            }
                        }
                    ],
                    as:"watchHistory"
                }
            },
            {
                $project : {
                    _id:1,
                    fullname:1,
                    username:1,
                    watchHistory : { 
                        $map : {
                            input:"$watchHistory",
                            as:"h",
                            in:{
                                _id:"$$h._id",
                                title:"$$h.title",
                                videoFile:"$$h.videoFile",
                                duration:"$$h.duration",
                                description:"$$h.description",
                                views:"$$h.views",
                                createdAt:"$$h.createdAt",
                                updatedAt:"$$h.updatedAt",
                                thumbnail:"$$h.thumbnail",
                                owner : {
                                    fullname: {$arrayElemAt : ["$$h.owner.fullname",0] },
                                    email: {$arrayElemAt : ["$$h.owner.email",0] },
                                    username: {$arrayElemAt : ["$$h.owner.username",0] },
                                    avatar: {$arrayElemAt : ["$$h.owner.avatar",0] }
                                }
                            }
                        }
                    }
                }
            }

        ]
   )
    return res.status(200)
    .json( new ApiResponse(watchHistory[0],true,"watch History",200))


} );

const getAllNotification = asyncHandler( async (req,res) => {
    
    const notifications = await subscriptionModel.aggregate([
        {
          $match: {
            $expr: {
              $eq: ["$subscriber", new mongoose.Types.ObjectId(req.user.id)]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channels",
            pipeline: [
              {
                $lookup: {
                  from: "videos",
                  let: { ownerId: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$owner", "$$ownerId"]
                        }
                      }
                    },
                    {
                      $sort: { createdAt: -1 }
                    },
                    {
                      $limit: 1
                    }
                  ],
                  as: "notifications"
                }
              },
              {
                $addFields: {
                  notifications: { $first: "$notifications" }
                }
              }
            ]
          }
        },
        {
          $project: {
            channels: {
              $map: {
                input: "$channels",
                as: "channel",
                in: {
                  _id:"$$channel._id",
                  fullname: "$$channel.fullname",
                  avatar: "$$channel.avatar",
                  notifications: "$$channel.notifications",
                  
                }
              }
            }
          }
        }
    ]);
      
    
    return res.json(new ApiResponse(notifications,true,"All notifications",200))

})

const checkUserByEmail = asyncHandler( async (req,res) => {

    const {email} = req?.body;

    if(!email) throw new ApiError(404,"Email not found");

    const findUserByEmail  = await UserModel.findOne({email:email}).select("-password -refreshToken");

    if(!findUserByEmail){
        throw new ApiError(404,"User No found");
    }

    return res.json( new ApiResponse(findUserByEmail,true,"User successfully found",200))

})

const removeVideoFromWatchHistory = asyncHandler(async (req,res) => {
    const {videoId} = req.params;
    
    if(!videoId){
        throw new ApiError(404,"VideoId is not found")
    }

    const findWatchHistoryIdIsExist = await UserModel.findOne({watchHistory:{$in:[new mongoose.Types.ObjectId(videoId)]}});
    if(!findWatchHistoryIdIsExist){
        throw new ApiError(404,"Video is not exist by this is "+videoId)
    }
    const removeVideoFromWatchHistory = await UserModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(req?.user?._id) },  
        { $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) } }, // update object
        { new: true } 
    );      
    if(!removeVideoFromWatchHistory){
        throw new ApiError(500,"Server Error");
    }

    // finaly return watch history is deleted single item
    return res.json( new ApiResponse("",true,"Video Removed from watchHistory",200));

})

const getSidebarLatestSubscriptions = asyncHandler(async (req,res) => {

    const data = await UserModel.aggregate( [
        {
            $match : {
                $expr : {
                    $eq : ["$_id",new mongoose.Types.ObjectId(req.user._id)]
                }
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                let:{userId:"$_id"},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $eq : ["$subscriber","$$userId"]
                            }
                        }
                    },
                    {
                        $lookup : {
                            from : "videos",
                            let:{channel:"$channel"},
                            pipeline : [
                                {
                                    $match : {
                                        $expr : {
                                            $and : [
                                            { $eq : ["$owner","$$channel"]},
                                            { $gte : ["$createdAt",new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 ) ]}
                                            ]
                                        }
                                    }
                                }
                            ],
                            as:"videos"
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            let:{channel:"$channel"},
                            pipeline : [
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$channel"]
                                        }
                                    }
                                }
                            ],
                            as:"channel"
                        }
                    },
                    {
                        $unwind : "$channel"
                    }
                ],
                as:"subscriptions"
            }
        },
        {
            $project : {
                _id:1,
                fullname:1,
                username:1,
                email:1,
                avatar:1,
                subscriptions : {
                    $map : {
                        input:"$subscriptions",
                        as:"sub",
                        in : {
                            _id:"$sub._id",
                            channel:{
                                _id:"$$sub.channel._id",
                                fullname:"$$sub.channel.fullname",
                                avatar:"$$sub.channel.avatar",
                                username:"$$sub.channel.username",
                            },
                            isRecentlyVideoUploaded:{
                                $cond : {
                                    if : {$gt : [{$size : "$$sub.videos"},0]},
                                    then : true,
                                    else : false
                                }
                            },
                        }
                    }
                } 
            }
        }
    ] )

    return res.json(new ApiResponse(data[0],true,"Sidebar Subscription has been fetched",200));

})

const getChannelVideos = asyncHandler( async (req,res) => {
    const {username} = req.params;
    if(!username){
        throw new ApiError(404,"ChannelId is required");
    }
    const channelVideos = await UserModel.aggregate( [
        {
            $match : {
                username : username
            }
        },
        {
            $lookup : {
                from : "videos",
                let:{userId:"$_id"},
                pipeline : [
                    {
                        $match : {
                            $expr : {
                                $eq : ["$owner","$$userId"]
                            }
                        }
                    },
                    {
                        $sort : {
                            created:-1,
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            let : {owner:"$owner"},
                            pipeline : [
                                {
                                    $match : {
                                        $expr : {
                                            $eq : ["$_id","$$owner"]
                                        }
                                    }
                                }
                            ],
                            as:"owner"
                        }
                    },
                    {
                        $unwind : "$owner"
                    }
                ],
                as:"videos"
            }
        },
        {
            $project : {
                _id:1,
                fullname:1,
                username:1,
                coverImage:1,
                avatar:1,
                thumbnail:1,
                createdAt:1,
                videos : {
                    $map : {
                        input : "$videos",
                        as:"v",
                        in : {
                            _id:"$$v._id",
                            title:"$$v.title",
                            description:"$$v.description",
                            createdAt:"$$v.createdAt",
                            duration:"$$v.duration",
                            views:"$$v.views",
                            thumbnail:"$$v.thumbnail",
                            videoFile:"$$v.videoFile",
                            owner : {
                                fullname:"$$v.owner._id",
                                username:"$$v.owner.username",
                                avatar:"$$v.owner.avatar",
                                createdAt:"$$v.owner.createdAt",
                                coverImage:"$$v.owner.coverImage",
                            }
                        }
                    }
                }
            }
        }
    ] )
    return res.json(new ApiResponse(channelVideos[0],true,"Channel Videos Successfully fetched",200));
} );

export {
    registerUser,
    loginUser,
    logoutUser,
    accessRefreshToken,
    changeUserPassword,
    getCurrentUser,
    changeAvatarImage,
    changeCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    changeAccountDetails,
    getAllNotification,
    checkUserByEmail,
    removeVideoFromWatchHistory,
    searchWatchHistory,
    getSubscribedNotifications,
    getSidebarLatestSubscriptions,
    getChannelVideos,

}
